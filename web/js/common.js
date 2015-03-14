(function() {
    // Title Bar
    var home = $('.nav > #home'),
        notice = $('.nav > #notice'),
        nodong = $('.nav > #nodong');

    var selected;
    if (pathIs('/notice')) selected = notice;
    else if (pathIs('/nodong')) selected = nodong;
    else if (pathIs('/')) selected = home;
    selected.addClass('active');

    function pathIs(content) {
        return location.pathname.indexOf(content) == 0;
    }

  // Logout button
  $('#logout').click(function() {
      document.cookie = 'session=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      location.href='/login';
  });
})();