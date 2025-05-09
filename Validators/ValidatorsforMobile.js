
function signupValidatorForMobile(newUser) {
    const {mobile} = newUser;
    const generalMobileRegex = /^[\d()-+ ]{4,18}$/;

    if (!mobile) {
        return true
    }else if (!generalMobileRegex.test(mobile)){
        return true;
    }else {
        return false
    }    
}

module.exports = signupValidatorForMobile;




