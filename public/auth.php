<?php
require_once __DIR__ . '/../src/config/config.php';
require_once __DIR__ . '/../src/core/Session.php';

// Start session
Session::start();

// Check if already logged in - show message instead of redirect
$alreadyLoggedIn = Session::isLoggedIn();
if ($alreadyLoggedIn) {
  $userName = Session::get('firstName') . ' ' . Session::get('lastName');
  $userType = Session::getUserType();
  $dashboardPath = Session::getDashboardPath($userType);
}
?>
<!DOCTYPE html>
<html>

<head>
  <title>Authentication - Sakay Bravo</title>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no" />
  <link rel="stylesheet" href="css/auth.css" />
  <link rel="icon" type="image/x-icon" href="views/assets/Logo.png">
</head>

<body class="landing">
  <div id="page-wrapper">
    <section id="header" class="wrapper">
      <div id="logo">
        <a href="">
          <img src="views/assets/SAKAY BRAVO LOGO_DARK YELLOW.png" alt="Sakay Bravo Logo" />
        </a>
        <p class="logo-caption">
          Kasama mo sa biyahe, <br />
          Kasama mo sa <i>SLU</i>
        </p>
      </div>

      <div class="container">
        <?php if ($alreadyLoggedIn): ?>
          <!-- Already Logged In Message -->
          <div class="heading">Welcome Back!</div>
          <div class="subheading" style="text-align: center; margin: 1rem 0;">
            You're already logged in as <strong><?php echo htmlspecialchars($userName); ?></strong>
          </div>

          <div style="text-align: center; margin: 2rem 0;">
            <a href="<?php echo htmlspecialchars($dashboardPath); ?>"
              style="display: inline-block; padding: 0.75rem 2rem; background: #fcc200; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
              Go to Dashboard
            </a>
            <br><br>
            <a href="routes/logout.php"
              style="display: inline-block; padding: 0.75rem 2rem; background: #dc3545; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 1rem;">
              Logout & Sign In as Different User
            </a>
          </div>
        <?php else: ?>
          <!-- Normal Auth Form -->
          <div class="heading" id="formHeading">Sign In</div>
          <div class="toggle-text">
            <span id="toggleText">Don't have an account? <a id="toggleLink">Sign Up</a></span>
          </div>

          <form id="authForm" class="form">
            <!-- Common Fields -->
            <input class="input" type="email" name="email" id="email" placeholder="E-mail" required />

            <span class="forgot-password" id="forgotPassword">
              <a href="#">Forgot Password?</a>
            </span>
            <input class="login-button" type="submit" value="Sign In" id="submitButton" />
          </form>
        <?php endif; ?>
      </div>
    </section>
  </div>

  <?php if (!$alreadyLoggedIn): ?>
    <script src="js/authentication.js"></script>
  <?php endif; ?>
  <script src="js/slideshow.js"></script>
</body>

</html>