const User = require("../models/user");

const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const sendToken = require("../utils/jwtToken");
const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto");

//REGISTER A USER => /api/v1/register

exports.registerUser = catchAsyncErrors(async (req, res, next) => {
  const { name, email, password } = req.body;

  const user = await User.create({
    name,
    email,
    password,
    avatar: {
      public_id: "bb2ac0e6-eb00-4af0-b86c-ab833804927d",
      url: "https://www.freepik.com/free-ai-image/androgynous-avatar-non-binary-queer-person_133543503.htm?log-in=google#query=avatar&position=4&from_view=keyword&track=ais_hybrid&uuid=bb2ac0e6-eb00-4af0-b86c-ab833804927d",
    },
  });

  sendToken(user, 200, res);
});

//FORGOT PASSWORD /api/v1/password/forgot
exports.forgotPassword = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new ErrorHandler("User not found with this email", 404));
  }

  //get reset token
  const resetToken = user.getResetPasswordToken();

  await user.save({ validateBeforeSave: false });

  //creatr password url
  const resetUrl = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/password/reset/${resetToken}`;

  const message = `Your password reset token is as follow:\n\n${resetUrl}\n\nif you never requested the email
    , ignore it`;

  try {
    await sendEmail({
      email: user.email,
      subject: "ShopIt Password Recovery",
      message,
    });
    res.status(200).json({
      success: true,
      message: `Email send to: ${user.email}`,
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save({ validateBeforeSave: false });

    return next(new ErrorHandler(error.message, 500));
  }
});

//login user
exports.loginUser = catchAsyncErrors(async (req, res, next) => {
  const { email, password } = req.body;

  //check if email and password has been entered by user
  if (!email || !password) {
    return next(new ErrorHandler("Please enter email and password", 400));
  }
  //finding user in database
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return next(new ErrorHandler("Invalid email or password", 401));
  }
  //check if password is correct or not
  const isPasswordMatched = await user.comparePassword(password);

  if (!isPasswordMatched) {
    return next(new ErrorHandler("invalid email or password", 401));
  }

  sendToken(user, 200, res);
});

//reset password /api/v1/password/reset/token
exports.resetPassword = catchAsyncErrors(async (req, res, next) => {
  //hash url
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");
  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return next(
      new ErrorHandler("Password is invalid or token has expired", 400)
    );
  }
  if (req.body.password !== req.body.confirmPassword) {
    return next(new ErrorHandler("Password does not match", 400));
  }

  //setup new password
  user.password = req.body.password;

  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  sendToken(user, 200, res);
});



//Get currently login user details /api/v1/me
exports.getUserProfile = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    user
  })
})


//Update / change password /api/v1/password/update
exports.updatePassword = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+password');

  //check previous user password
  const isMatched = await user.comparePassword(req.body.oldPassword)
  if(!isMatched) {
    return next(new ErrorHandler('Old password is correct'));
  }

  user.password = req.body.password;
  await user.save();

  sendToken(user, 200, res)

})

//update users profile /api/v1/me/update
exports.updateUserProfile = catchAsyncErrors(async (req, res, next) => {
  const newUserData ={
    name: req.body.name,
    email: req.body.email
  }

  //update avatar: TODO


    const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
      new: true,
      runValidators: true,
      useFindAndModify: false
    })
    res.status(200).json({
      success: true
    })
})




//LOGOUT User => /api/v1/logOut
exports.logout = catchAsyncErrors(async (req, res, next) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });
  res.status(200).json({
    success: true,
    message: "Logged Out Successfully",
  });
});

//admin routes


//get all users   /api/v1/admin/users
exports.allUsers = catchAsyncErrors(async (req, res, next) => {
  const users = await User.find();

  res.status(200).json({
    success: true,
    users
  })
})


//get user details  /api/v1/user/:id
exports.getUserDetails = catchAsyncErrors( async (req, res, next) => {
  const user = await User.findById(req.params.id)

  if(!user) {
    return next(new ErrorHandler(`User not found with id: ${req.params.id}`))
  }

  res.status(200).json({
    success: true,
    user

  })
  
})


//update user profile  /api/v1/admin/user/:id
exports.updateUser = catchAsyncErrors(async (req, res, next) => {
  const newUserData ={
    name: req.body.name,
    email: req.body.email,
    role: req.body.role
  }



    const user = await User.findByIdAndUpdate(req.params.id, newUserData, {
      new: true,
      runValidators: true,
      useFindAndModify: false
    })
    res.status(200).json({
      success: true
    })
})

//delete user   /api/v1/user/:id
exports.deleteUser = catchAsyncErrors( async (req, res, next) => {
  const user = await User.findById(req.params.id)

  if(!user) {
    return next(new ErrorHandler(`User not found with id: ${req.params.id}`))
  }

  //remove avatar from cloudinary TODO
  
  await user.remove();

  res.status(200).json({
    success: true,
    

  })
  
})