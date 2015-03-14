(function() {
    // Login
    // whenEnter('#email', login);
    // whenEnter('#pw', login);
    // $('#signIn').click(login);
    $('#loginForm').submit(login);

    function login() {
        var email = $('#email').val();
        var pw = $('#pw').val();

        if (email.length == 0) {
            alert('이메일 주소를 입력하세요.');
            return false;
        }
        if (pw.length == 0) {
            alert('패스워드를 입력하세요.');
            return false;
        }
        $('#realPw').val(encrypt(pw));
        return true;
    }

    // REgister
    $('#register').click(register);
    function register() {
        var data = {};
        data.email = $('#registerEmail').val();
        if (data.email.length == 0) { alert('이메일을 입력하세요.'); return false; }

        data.pw = $('#registerPw').val();
        if (data.pw.length == 0) { alert('패스워드를 입력하세요.'); return false; }

        var repw = $('#registerRePw').val();
        if (repw != data.pw) { alert('패스워드가 일치하지 않습니다ㅜㅜ'); return false; }

        data.name = $('#registerName').val();
        if (data.name.length == 0) { alert('이름을 입력하세요.'); return false; }

        data.sid = $('#registerSid').val();
        if (data.sid.length == 0) { alert('학번을 입력하세요.'); return false; }

        data.phone = $('#registerPhone').val();
        if (data.phone.length == 0) { alert('휴대폰 번호를 입력하세요.'); return false; }

        data.pw = encrypt(data.pw);

        $.post('/register', data, function(result) {
            if (result.error) return alert(error.msg);
            return alert('회원가입에 성공했습니다. 로그인해주세요.');
        });
    }

    // Center modal
    function centerModals(){
        $('.modal').each(function(i){
            var $clone = $(this).clone().css('display', 'block').appendTo('body');
            var top = Math.round(($clone.height() - $clone.find('.modal-content').height()) / 2);
            top = top > 0 ? top : 0;
            $clone.remove();
            $(this).find('.modal-content').css("margin-top", top);
        });
    }
    function resizeNav() {
        if ($(document).width() > 992) {
            $('.navigation').css('max-height', ($(window).height()-70)+'px');
        } else $('.navigation').css('max-height', 'auto');
    }

    $('.modal').on('show.bs.modal', centerModals);
    resizeNav();

    $(window).on('resize', function() {
        resizeNav();
        centerModals();
    });


    function encrypt(pw) {
        return CryptoJS.SHA256('PyvJ2amWMZ94fvbB7g9Mkg'+pw+'MIIGRJUnXwGvooIlm3muEw').toString();
    }
})();