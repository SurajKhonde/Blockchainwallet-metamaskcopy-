
 function signupValidatorForEmail(newUser) {
  const { email } = newUser;

  if (!email) {
    return true;
  } else if (!/\S+@\S+\.\S+/.test(email)) {
    return true;
  }else {
    return false;

  }
 
}

module.exports = signupValidatorForEmail;
