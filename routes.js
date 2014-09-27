module.exports = function(app, passport) {

    app.get('/', function (req, res) {
        res.render('home')
    });

    app.get('/login', function (req, res) {
        // render the page and pass in any flash data if it exists
        res.render('login', {message: req.flash('loginMessage')});
    });

    app.get('/signup', function (req, res) {
        res.render('signup', {message: req.flash('signupMessage')});
    });

    app.get('/profile-local', isLoggedIn, function (req, res) {
        res.render('profile-local', {
            user: req.user // get the user out of session and pass to template
        });
    });

    app.get('/profile-facebook', isLoggedIn, function (req, res) {
        res.render('profile-facebook', {
            user: req.user // get the user out of session and pass to template
        });
    });

    // =====================================
    // FACEBOOK ROUTES =====================
    // =====================================
    // route for facebook authentication and login
    app.get('/auth/facebook', passport.authenticate('facebook', { scope : 'email' }));

    // handle the callback after facebook has authenticated the user
    app.get('/auth/facebook/callback',
        passport.authenticate('facebook', {
            successRedirect : '/profile-facebook',
            failureRedirect : '/'
        }));

    app.get('/logout', function (req, res) {
        req.logout();
        res.redirect('/');
    });

    app.get('/unauthorized', function (req, res) {
        res.render('unauthorized');
    });

    // =====================================
    // LOCAL ROUTES =====================
    // =====================================
    // route for local authentication and login
    // process the signup form
    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect: '/profile-local', // redirect to the secure profile section
        failureRedirect: '/signup', // redirect back to the signup page if there is an error
        failureFlash: true // allow flash messages
    }));

    // process the login form
    app.post('/login', passport.authenticate('local-login', {
        successRedirect: '/profile-local', // redirect to the secure profile section
        failureRedirect: '/login', // redirect back to the signup page if there is an error
        failureFlash: true // allow flash messages
    }));
};

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/');
}