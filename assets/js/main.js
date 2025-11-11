(function ($) {
  ('use strict');

  var windowOn = $(window);
  ///////////////////////////////////////////////////
  // 01. PreLoader Js
  windowOn.on('load', function () {
    $('#loading').fadeOut(500);
  });

  $(window).on('load', function () {
    $('#preloader').delay(350).fadeOut('slow');
    $('body').delay(350).css({ overflow: 'visible' });
  });

  ///////////////////////////////////////////////////
  // 02. SubMenu Dropdown Toggle
  if ($('.tp-main-menu nav > ul > li.has-dropdown > a').length) {
    $('.tp-main-menu nav > ul > li.has-dropdown > a').append(
      '<i class="fal fa-angle-down"></i>'
    );
  }

  ///////////////////////////////////////////////////
  // 03. scroll-to-target
  windowOn.on('scroll', function () {
    var scroll = windowOn.scrollTop();
    if (scroll < 500) {
      $('.scroll-to-target').removeClass('open');
    } else {
      $('.scroll-to-target').addClass('open');
    }
  });

  ///////////////////////////////////////////////////
  // 04. Scroll Up Js
  if ($('.scroll-to-target').length) {
    $('.scroll-to-target').on('click', function () {
      var target = $(this).attr('data-target');
      $('html, body').animate(
        {
          scrollTop: $(target).offset().top,
        },
        1000
      );
    });
  }

  function smoothSctollTop() {
    $('.smooth a').on('click', function (event) {
      var target = $(this.getAttribute('href'));
      if (target.length) {
        event.preventDefault();
        $('html, body')
          .stop()
          .animate(
            {
              scrollTop: target.offset().top - 150,
            },
            1000
          );
      }
    });
  }
  smoothSctollTop();

  // WOW (solo si existe)
  if (typeof WOW !== 'undefined') {
    try {
      new WOW({ mobile: true }).init();
    } catch (e) {}
  }

  // AOS (solo si existe)
  if (typeof AOS !== 'undefined') {
    try {
      AOS.init();
    } catch (e) {}
  }

  ///////////////////////////////////////////////////
  // BÓRRA TODO ESTE BLOQUE
  ///////////////////////////////////////////////////
  // 05. wow animation
  var wow = new WOW({
    mobile: true,
  });
  wow.init();

  // 05. AOS animation (reemplazando a WOW)
  AOS.init();
  ///////////////////////////////////////////////////
  // 06. Sticky Header Js
  windowOn.on('scroll', function () {
    var scroll = windowOn.scrollTop();
    if (scroll < 400) {
      $('#header-sticky').removeClass('header-sticky');
    } else {
      $('#header-sticky').addClass('header-sticky');
    }
  });

  ////////////////////////////////////////////////////
  // 07. Mobile Menu Js
  $('#mobile-menu').meanmenu({
    meanMenuContainer: '.mobile-menu',
    meanScreenWidth: '1199',
    meanExpand: ['<i class="fal fa-plus"></i>'],
  });

  $('#mobile-menu-2').meanmenu({
    meanMenuContainer: '.mobile-menu',
    meanScreenWidth: '6000',
    meanExpand: ['<i class="fal fa-plus"></i>'],
  });

  ////////////////////////////////////////////////////
  // 08. Sidebar Js
  $('.tp-menu-bar').on('click', function () {
    $('.tpoffcanvas').addClass('opened');
    $('.body-overlay').addClass('apply');
  });

  $('.close-btn, .body-overlay').on('click', function () {
    $('.tpoffcanvas').removeClass('opened');
    $('.body-overlay').removeClass('apply');
  });

  ///////////////////////////////////////////////////
  // 09. Magnific Js
  $('.popup-video').magnificPopup({
    type: 'iframe',
  });

  $('.popup-image').magnificPopup({
    type: 'image',
    gallery: {
      enabled: true,
    },
  });

  ////////////////////////////////////////////////////
  // 10. Data CSS Js
  $('[data-background]').each(function () {
    $(this).css(
      'background-image',
      'url(' + $(this).attr('data-background') + ')'
    );
  });

  $('[data-width]').each(function () {
    $(this).css('width', $(this).attr('data-width'));
  });

  $('[data-bg-color]').each(function () {
    $(this).css('background-color', $(this).attr('data-bg-color'));
  });

  ////////////////////////////////////////////////////
  // 11. Counter Js
  $('.counter').counterUp({
    delay: 10,
    time: 1000,
  });

  ////////////////////////////////////////////////////
  // 12. Sliders Js
  function initSlider(selector, options) {
    $(selector).slick(options);
  }

  // Home slider
  initSlider('.tp-slider-active', {
    fade: true,
    autoplay: true,
    slidesToShow: 1,
    arrows: true,
    prevArrow:
      '<button type="button" class="slick-prev"><i class="fal fa-long-arrow-left"></i></button>',
    nextArrow:
      '<button type="button" class="slick-next"><i class="fal fa-long-arrow-right"></i></button>',
    responsive: [
      {
        breakpoint: 992,
        settings: { arrows: false },
      },
    ],
  });

  // Brand slider
  initSlider('.brand-slider-active', {
    autoplay: false,
    slidesToShow: 6,
    arrows: false,
    responsive: [
      {
        breakpoint: 1200,
        settings: { slidesToShow: 5 },
      },
      {
        breakpoint: 992,
        settings: { slidesToShow: 4 },
      },
      {
        breakpoint: 768,
        settings: { slidesToShow: 3 },
      },
      {
        breakpoint: 480,
        settings: { slidesToShow: 2 },
      },
    ],
  });

  // Blog slider
  initSlider('.blog-post-slider-active', {
    autoplay: false,
    slidesToShow: 1,
    arrows: false,
  });

  // Case studies slider
  initSlider('.tp-case-slider-active', {
    autoplay: false,
    slidesToShow: 2,
    arrows: false,
    responsive: [
      {
        breakpoint: 768,
        settings: { slidesToShow: 1 },
      },
    ],
  });

  // Testimonial slider
  initSlider('.testimonial-slider-active', {
    autoplay: false,
    slidesToShow: 3,
    arrows: false,
    dots: true,
    responsive: [
      {
        breakpoint: 1200,
        settings: { slidesToShow: 2 },
      },
      {
        breakpoint: 768,
        settings: { slidesToShow: 1 },
      },
    ],
  });

  // Team slider
  initSlider('.tp-team-slider-active', {
    autoplay: false,
    slidesToShow: 4,
    arrows: true,
    prevArrow:
      '<button type="button" class="slick-prev"><i class="fal fa-arrow-left"></i></button>',
    nextArrow:
      '<button type="button" class="slick-next"><i class="fal fa-arrow-right"></i></button>',
    responsive: [
      {
        breakpoint: 1400,
        settings: {
          arrows: false,
          slidesToShow: 3,
        },
      },
      {
        breakpoint: 992,
        settings: {
          arrows: false,
          slidesToShow: 2,
        },
      },
      {
        breakpoint: 768,
        settings: {
          arrows: false,
          slidesToShow: 1,
        },
      },
    ],
  });

  ////////////////////////////////////////////////////
  // 13. Shop Js

  // Nice Select
  $('select').niceSelect();

  // Cart Quantity
  /* Deshabilitado temporalmente: handlers del carrito generan errores/performance
	// Cart Quantity
	$('.cart-minus').on('click', function () {
		var $input = $(this).parent().find('input');
		var count = parseInt($input.val()) - 1;
		count = count < 1 ? 1 : count;
		$input.val(count);
		$input.change();
		return false;
	});

	$('.cart-plus').on('click', function () {
		var $input = $(this).parent().find('input');
		$input.val(parseInt($input.val()) + 1);
		$input.change();
		return false;
	});
	*/

  // Price Range Slider
  if ($('#slider-range').length) {
    $('#slider-range').slider({
      range: true,
      min: 0,
      max: 500,
      values: [75, 300],
      slide: function (event, ui) {
        $('#amount').val('$' + ui.values[0] + ' - $' + ui.values[1]);
      },
    });

    $('#amount').val(
      '$' +
        $('#slider-range').slider('values', 0) +
        ' - $' +
        $('#slider-range').slider('values', 1)
    );

    $('#filter-btn').on('click', function () {
      $('.filter-widget').slideToggle(1000);
    });
  }

  ////////////////////////////////////////////////////
  // 14. Checkout Js
  $('#showlogin').on('click', function () {
    $('#checkout-login').slideToggle(900);
  });

  $('#showcoupon').on('click', function () {
    $('#checkout_coupon').slideToggle(900);
  });

  $('#cbox').on('click', function () {
    $('#cbox_info').slideToggle(900);
  });

  $('#ship-box').on('click', function () {
    $('#ship-box-info').slideToggle(1000);
  });

  ////////////////////////////////////////////////////
  // 15. isotope Js
  $('.grid').imagesLoaded(function () {
    var $grid = $('.grid').isotope({
      itemSelector: '.grid-item',
      percentPosition: true,
      layoutMode: 'fitRows',
      masonry: {
        columnWidth: 1,
      },
    });

    $('.masonary-menu').on('click', 'button', function () {
      var filterValue = $(this).attr('data-filter');
      $grid.isotope({
        filter: filterValue,
        animationOptions: {
          duration: 10000,
          easing: 'linear',
          queue: true,
        },
      });
    });

    $('.masonary-menu button').on('click', function (event) {
      $(this).siblings('.active').removeClass('active');
      $(this).addClass('active');
      event.preventDefault();
    });
  });
})(jQuery);
