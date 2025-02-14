const express = require('express');
const Favorite = require('../models/customerFavoriteStall')
const isLoggedIn = require('../middleware/authMiddleware');
const router = express.Router();
const StallOwnerProfile = require('../models/StallOwner_profile');

router.put('/:customerID/favorite/:stallownerID', isLoggedIn, async (req, res) => {
    try {
        const customerID = req.user._id; 
        const stallownerID = req.params.stallownerID;

        const existingFavorite = await Favorite.findOne({ customerID, stallownerID });
        if (existingFavorite) {
            return res.status(400).json({ error: 'Stall is already in the favorites list' });
        }

        const newFavorite = new Favorite({ customerID, stallownerID });
        await newFavorite.save();

        res.json({ message: 'Stall added to favorites successfully' });
    } catch (error) {
        console.error('Error adding to favorites:', error);
        res.status(500).json({ error: 'Failed to add to favorites' });
    }
});
router.delete('/:customerID/favorite/:stallownerID', isLoggedIn, async (req, res) => {
    try {
        const customerID = req.user._id;
        const stallownerID = req.params.stallownerID;

        
        const removedFavorite = await Favorite.findOneAndDelete({ customerID, stallownerID });
        if (!removedFavorite) {
            return res.status(404).json({ error: 'Favorite not found' });
        }

        res.json({ message: 'Stall removed from favorites successfully' });
    } catch (error) {
        console.error('Error removing from favorites:', error);
        res.status(500).json({ error: 'Failed to remove from favorites' });
    }
});
router.get('/:_id/favorite', isLoggedIn, async (req, res) => {
    try {
        const customerID = req.user._id;
        const favorites = await Favorite.find({ customerID }).populate('stallownerID');

        if (!favorites || favorites.length === 0) {
            return res.json({ message: 'No favorite stalls found', favorites: [] });
        }
        const favoriteStalls = await Promise.all(favorites.map(async (favorite) => {
            const stallOwnerProfile = await StallOwnerProfile.findOne({ StallOwnerID: favorite.stallownerID._id });
            if (stallOwnerProfile) {
                return {
                    id: favorite.stallownerID._id,
                    name: stallOwnerProfile.restaurant.name,
                    image: stallOwnerProfile.restaurant.photo,
                    rating: stallOwnerProfile.restaurant.rating,
                    menuUrl: `http://ec2-13-215-252-79.ap-southeast-1.compute.amazonaws.com:3000/dashboard/stallowner/${stallOwnerProfile.StallOwnerID}/menu/`,
                    // menuUrl: `http://localhost:3000/dashboard/stallowner/${stallOwnerProfile.StallOwnerID}/menu/`
                };
            }
            return null;
        }));

        res.json({ favorites: favoriteStalls.filter(stall => stall !== null) });
    } catch (error) {
        console.error('Error fetching favorite stalls:', error);
        res.status(500).json({ error: 'Failed to fetch favorite stalls' });
    }
});
module.exports = router;

