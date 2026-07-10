(function ($) {
  'use strict';

  /*
  |--------------------------------------------------------------------------
  | Template Name: Arkdin
  | Author: ThemeServices
  | Version: 1.0.0
  |--------------------------------------------------------------------------
  |--------------------------------------------------------------------------
  | TABLE OF CONTENTS:
  |--------------------------------------------------------------------------
  |
  | 1. Preloader
  | 2. Mobile Menu
  | 3. Sticky Header
  | 4. Dynamic Background
  | 5. Slick Slider
  | 6. Modal Video
  | 7. Accordian
  | 8. Tabs
  | 9. Progress Bar
  | 10. Review
  |
  */

  /*--------------------------------------------------------------
    Scripts initialization
  --------------------------------------------------------------*/
  $.exists = function (selector) {
    return $(selector).length > 0;
  };

  $(window).on('load', function () {
    preloader();
  });

  $(function () {
    mainNav();
    stickyHeader();
    dynamicBackground();
    slickInit();
    modalVideo();
    accordian();
    tabs();
    progressBar();
    review();
    if ($.exists('.wow')) {
      new WOW().init();
    }
    if ($.exists('.player')) {
      $('.player').YTPlayer();
    }
  });

  /*--------------------------------------------------------------
    1. Preloader
  --------------------------------------------------------------*/
  function preloader() {
    $('.cs_preloader').fadeOut();
    $('cs_preloader_in').delay(150).fadeOut('slow');
  }

  /*--------------------------------------------------------------
    2. Mobile Menu
  --------------------------------------------------------------*/
  function mainNav() {
    $('.cs_nav').append('<span class="cs_menu_toggle"><span></span></span>');
    $('.menu-item-has-children').append(
      '<span class="cs_menu_dropdown_toggle"><span></span></span>',
    );
    $('.cs_menu_toggle').on('click', function () {
      $(this)
        .toggleClass('cs_toggle_active')
        .siblings('.cs_nav_list')
        .toggleClass('cs_active');
    });
    $('.cs_menu_toggle')
      .parents('body')
      .find('.cs_side_header')
      .addClass('cs_has_main_nav');
    $('.cs_menu_toggle')
      .parents('body')
      .find('.cs_toolbox')
      .addClass('cs_has_main_nav');
    $('.cs_menu_dropdown_toggle').on('click', function () {
      $(this).toggleClass('active').siblings('ul').slideToggle();
      $(this).parent().toggleClass('active');
    });
  }

  /*--------------------------------------------------------------
    3. Sticky Header
  --------------------------------------------------------------*/
  function stickyHeader() {
    var $window = $(window);
    var lastScrollTop = 0;
    var $header = $('.cs_sticky_header');
    var headerHeight = $header.outerHeight() + 20;

    $window.scroll(function () {
      var windowTop = $window.scrollTop();

      if (windowTop >= headerHeight) {
        $header.addClass('cs_gescout_sticky');
      } else {
        $header.removeClass('cs_gescout_sticky');
        $header.removeClass('cs_gescout_show');
      }

      if ($header.hasClass('cs_gescout_sticky')) {
        if (windowTop < lastScrollTop) {
          $header.addClass('cs_gescout_show');
        } else {
          $header.removeClass('cs_gescout_show');
        }
      }
      lastScrollTop = windowTop;
    });
  }

  /*--------------------------------------------------------------
    4. Dynamic Background
  --------------------------------------------------------------*/
  function dynamicBackground() {
    $('[data-src]').each(function () {
      var src = $(this).attr('data-src');
      $(this).css({
        'background-image': 'url(' + src + ')',
      });
    });
  }

  /*--------------------------------------------------------------
    5. Slick Slider
  --------------------------------------------------------------*/
  function slickInit() {
    if ($.exists('.cs_slider')) {
      $('.cs_slider').each(function () {
        // Slick Variable
        var $ts = $(this).find('.cs_slider_container');
        var $slickActive = $(this).find('.cs_slider_wrapper');
        // Auto Play
        var autoPlayVar = parseInt($ts.attr('data-autoplay'), 10);
        // Auto Play Time Out
        var autoplaySpdVar = 3000;
        if (autoPlayVar > 1) {
          autoplaySpdVar = autoPlayVar;
          autoPlayVar = 1;
        }
        // Slide Change Speed
        var speedVar = parseInt($ts.attr('data-speed'), 10);
        // Slider Loop
        var loopVar = Boolean(parseInt($ts.attr('data-loop'), 10));
        // Slider Center
        var centerVar = Boolean(parseInt($ts.attr('data-center'), 10));
        // Variable Width
        var variableWidthVar = Boolean(
          parseInt($ts.attr('data-variable-width'), 10),
        );
        // Pagination
        var paginaiton = $(this)
          .find('.cs_pagination')
          .hasClass('cs_pagination');
        // Slide Per View
        var slidesPerView = $ts.attr('data-slides-per-view');
        if (slidesPerView == 1) {
          slidesPerView = 1;
        }
        if (slidesPerView == 'responsive') {
          var slidesPerView = parseInt($ts.attr('data-add-slides'), 10);
          var lgPoint = parseInt($ts.attr('data-lg-slides'), 10);
          var mdPoint = parseInt($ts.attr('data-md-slides'), 10);
          var smPoint = parseInt($ts.attr('data-sm-slides'), 10);
          var xsPoing = parseInt($ts.attr('data-xs-slides'), 10);
        }
        // Fade Slider
        var fadeVar = parseInt($($ts).attr('data-fade-slide'));
        fadeVar === 1 ? (fadeVar = true) : (fadeVar = false);

        // Slick Active Code
        $slickActive.slick({
          autoplay: autoPlayVar,
          dots: paginaiton,
          centerPadding: '28%',
          speed: speedVar,
          infinite: loopVar,
          autoplaySpeed: autoplaySpdVar,
          centerMode: centerVar,
          fade: fadeVar,
          prevArrow: $(this).find('.cs_left_arrow'),
          nextArrow: $(this).find('.cs_right_arrow'),
          appendDots: $(this).find('.cs_pagination'),
          slidesToShow: slidesPerView,
          variableWidth: variableWidthVar,
          swipeToSlide: true,
          responsive: [
            {
              breakpoint: 1200,
              settings: {
                slidesToShow: lgPoint,
              },
            },
            {
              breakpoint: 992,
              settings: {
                slidesToShow: mdPoint,
              },
            },
            {
              breakpoint: 768,
              settings: {
                slidesToShow: smPoint,
              },
            },
            {
              breakpoint: 576,
              settings: {
                slidesToShow: xsPoing,
              },
            },
          ],
        });
      });
    }
    /* Service Product */
    $('.cs_service_product_thumb').slick({
      slidesToShow: 1,
      slidesToScroll: 1,
      arrows: false,
      asNavFor: '.cs_service_product_nav',
      appendDots: $('.cs_pagination_2'),
    });

    $('.cs_service_product_nav').slick({
      slidesToShow: 4,
      slidesToScroll: 1,
      asNavFor: '.cs_service_product_thumb',
      focusOnSelect: true,
      prevArrow: $('.cs_service_product_nav_left_arrow'),
      nextArrow: $('.cs_service_product_nav_right_arrow'),
      responsive: [
        {
          breakpoint: 1400,
          settings: {
            slidesToShow: 4,
          },
        },
        {
          breakpoint: 1199,
          settings: {
            slidesToShow: 3,
          },
        },
        {
          breakpoint: 991,
          settings: {
            slidesToShow: 2,
          },
        },
        {
          breakpoint: 575,
          settings: {
            slidesToShow: 1,
          },
        },
      ],
    });
  }

  /*--------------------------------------------------------------
    6. Modal Video
  --------------------------------------------------------------*/
  function modalVideo() {
    if ($.exists('.cs_video_open')) {
      $('body').append(`
        <div class="cs_video_popup">
          <div class="cs_video_popup-overlay"></div>
          <div class="cs_video_popup-content">
            <div class="cs_video_popup-layer"></div>
            <div class="cs_video_popup-container">
              <div class="cs_video_popup-align">
                <div class="embed-responsive embed-responsive-16by9">
                  <iframe class="embed-responsive-item" src="about:blank"></iframe>
                </div>
              </div>
              <div class="cs_video_popup-close"></div>
            </div>
          </div>
        </div>
      `);
      $(document).on('click', '.cs_video_open', function (e) {
        e.preventDefault();
        var video = $(this).attr('href');

        $('.cs_video_popup-container iframe').attr('src', `${video}`);

        $('.cs_video_popup').addClass('active');
      });
      $('.cs_video_popup-close, .cs_video_popup-layer').on(
        'click',
        function (e) {
          $('.cs_video_popup').removeClass('active');
          $('html').removeClass('overflow-hidden');
          $('.cs_video_popup-container iframe').attr('src', 'about:blank');
          e.preventDefault();
        },
      );
    }
  }

  /*--------------------------------------------------------------
    7. Accordian
  --------------------------------------------------------------*/
  function accordian() {
    $('.cs_accordian').children('.cs_accordian_body').hide();
    $('.cs_accordian.active').children('.cs_accordian_body').show();
    $('.cs_accordian_head').on('click', function () {
      $(this)
        .parent('.cs_accordian')
        .siblings()
        .children('.cs_accordian_body')
        .slideUp(250);
      $(this).siblings().slideDown(250);
      $(this)
        .parent()
        .parent()
        .siblings()
        .find('.cs_accordian_body')
        .slideUp(250);
      /* Accordian Active Class */
      $(this).parents('.cs_accordian').addClass('active');
      $(this).parent('.cs_accordian').siblings().removeClass('active');
    });
  }

  /*--------------------------------------------------------------
    8. Tabs
  --------------------------------------------------------------*/
  function tabs() {
    $('.cs_tabs .cs_tab_links a').on('click', function (e) {
      var currentAttrValue = $(this).attr('href');
      $('.cs_tabs ' + currentAttrValue)
        .fadeIn(400)
        .siblings()
        .hide();
      $(this).parents('li').addClass('active').siblings().removeClass('active');
      e.preventDefault();
    });
  }

  /*--------------------------------------------------------------
    9. Progress Bar
  --------------------------------------------------------------*/
  function progressBar() {
    $('.cs_progress').each(function () {
      var progressPercentage = $(this).data('progress') + '%';
      $(this).find('.cs_progress_in').css('width', progressPercentage);
    });
  }

  /*--------------------------------------------------------------
    10. Review
  --------------------------------------------------------------*/
  function review() {
    $('.cs_rating').each(function () {
      var review = $(this).data('rating');
      var reviewVal = review * 20 + '%';
      $(this).find('.cs_rating_percentage').css('width', reviewVal);
    });
  }
})(jQuery); // End of use strict

/* JUJCO premium 3D / 4D / 5D animations */
(function () {
  'use strict';
  function jujcoInit() {
    var tilt = '.cs_service_card, .cs_pricing_plan, .cs_team_member, .cs_post, .cs_project_card, .cs_card, .cs_iconbox';
    var reveal = '.cs_service_card, .cs_pricing_plan, .cs_team_member, .cs_post, .cs_project_card, .cs_card, .cs_iconbox, .cs_section_heading, .cs_cta, .cs_faq, .cs_contact_info, .cs_work_step';
    var supportsIO = ('IntersectionObserver' in window);
    var io = null;
    if (supportsIO) {
      io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            en.target.classList.add('jujco-show');
            io.unobserve(en.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    }
    /* 5D - pointer tracking 3D tilt */
    document.querySelectorAll(tilt).forEach(function (el) {
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = 'perspective(900px) rotateX(' + (-py * 9).toFixed(2) + 'deg) rotateY(' + (px * 9).toFixed(2) + 'deg) translateY(-8px) scale(1.025)';
      });
      el.addEventListener('mouseleave', function () {
        el.style.transform = '';
      });
    });
    /* 4D - scroll reveal */
    document.querySelectorAll(reveal).forEach(function (el, i) {
      el.classList.add('jujco-reveal');
      if (i % 3 === 1) el.classList.add('lvl-2');
      else if (i % 3 === 2) el.classList.add('lvl-3');
      if (io) io.observe(el);
      else el.classList.add('jujco-show');
    });
    /* Equalize card heights so "Why Choose Us" + "Contact Information" rows stay symmetric */
    var eqGroups = ['.cs_whychoose_grid', '.cs_contact_cards'];
    function jujcoEqualize() {
      eqGroups.forEach(function (g) {
        var containers = document.querySelectorAll(g);
        Array.prototype.forEach.call(containers, function (cont) {
          var cards = cont.querySelectorAll('.cs_iconbox');
          if (cards.length < 2) return;
          Array.prototype.forEach.call(cards, function (c) { c.style.height = ''; });
          var max = 0;
          Array.prototype.forEach.call(cards, function (c) {
            var h = c.offsetHeight;
            if (h > max) max = h;
          });
          if (max > 0) {
            Array.prototype.forEach.call(cards, function (c) { c.style.height = max + 'px'; });
          }
        });
      });
    }
    jujcoEqualize();
    var eqTimer = null;
    window.addEventListener('resize', function () {
      clearTimeout(eqTimer);
      eqTimer = setTimeout(jujcoEqualize, 150);
    });
    window.addEventListener('load', jujcoEqualize);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(jujcoEqualize);
  }
  if (document.readyState !== 'loading') jujcoInit();
  else document.addEventListener('DOMContentLoaded', jujcoInit);
})();