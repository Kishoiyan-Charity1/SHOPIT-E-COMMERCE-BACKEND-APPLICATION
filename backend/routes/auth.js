const express = require('express');
const router = express.Router();

const { registerUser, 
        loginUser, 
        logout, 
        forgotPassword, 
        resetPassword, 
        getUserProfile,
        updatePassword,
        updateUserProfile,
        getUserDetails,
        updateUser,
        deleteUser,
        allUsers
} = require('../controllers/authController');

const { isAuthenticatedUser , authorizeRoles} = require('../middlewares/auth')

const { route } = require('./product');

router.route('/register').post(registerUser);
router.route('/login').post(loginUser);

router.route('/password/forgot').post(forgotPassword)
router.route('/password/reset/:token').put(resetPassword)

router.route('/me').get(isAuthenticatedUser, getUserProfile)

router.route('/me/update').put(isAuthenticatedUser, updateUserProfile)


router.route('/password/update').put(isAuthenticatedUser, updatePassword)

router.route('/admin/users').get(isAuthenticatedUser, authorizeRoles('admin'), allUsers);

router.route('/logout').get(logout);

router.route('/admin/user/:id')
            .get(isAuthenticatedUser, authorizeRoles('admin'), getUserDetails)
            .put(isAuthenticatedUser, authorizeRoles('admin'), updateUser)
            .delete(isAuthenticatedUser, authorizeRoles('admin'), deleteUser)









module.exports = router;