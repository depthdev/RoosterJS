/*
 * Copyright 2014 by Intellectual Reserve, Inc.
 *
 * Licensed under the Apache License, Version 2.0
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Author:        Adam Carson
 * Dependencies:  jquery.js (1.8.3+)
 *
 * Name: ROOSTERJS / ROOSTER.JS
 * Description: Very simple lazy-loader of images, iframes and scripts.  Mobile friendly.
 * Options: Change the delay between the checking of approaching lazy-loaded items; and change the distance a lazy-loaded item should be loaded from the bottom of the screen regardless of orientation change.
 *
 */

// Why call it "Rooster?" Well, I'm tired--so that's the first reason. The second, is because roosters watch for the sun to rise, and right before it does, they cock. Likewise, lazy-loading does the same thing, it watches for when a specified element is about to be scrolled on the page and then it loads in the appropriate resource so it appears. The wild referece is a play on a "wild rooster" and the fact that it's a "wild card" (whether you use all or only some elements to lazy-load and for the various types).

var ROOSTER = {
  // Disable lazy-loading but load all images?
  disabled: false,
  // Script placeholder element
  script_placeholder: 'span',
  // Will hold the viewport height so image can load on or right before it comes on the screen.  It can be modified via the init().
  viewport_height : $(window).height(),
  // Preload the elements 'n' pixels before the bottom of the viewport
  preload_distance : 0,
  // Find all stars (suns) with a data attribute of "sun" on it
  stars : $('[data-sun-low], [data-sun-medium], [data-sun-high], [data-sun-iframe], [data-sun-script]'),
  // Empty array for storing eacy element's distance from the top of the document
  sun_distances : [],
  // Ignore pixel ratio and serve only "data-sun-default" images if boolean is true
  ignore: false,
  // These are the pixel ratios. data-sun-low is served if the pixel ratio is <= low, data-sun-medium if it's > low && < high, and data-sun-high if it's >= high
  pixel_ratio: parseInt(window.devicePixelRatio) || 1,
  pixel_ratio_medium: 1.5,
  pixel_ratio_high: 2,
  image_quality: 'default',
  // jQuery fadeIn duration
  animation_duration: 300,
  // Delay properties for the frequency of rechecking the document (the higher the delay, the higher the cpu performance)
  // This will be the setTimeout() for the delay
  delay : null,
  // Actual time in milliseconds for the setTimeout() above
  delay_duration : 250,
  // Is it okay to run the image load function? (Is the setTimout() still running so this currently false?)
  proceed : true,
  // Empty array to identify already-loaded elements
  loaded : [],
  // Are all suns loaded? If so, don't check for anything
  done: false,

  // Loop through each element's distance and see if any should be loaded at the current scroll point
  load : function() {
    // Have we already loaded everything? If not, let's do this thing!
    if(!this.done) {
      // Where are we currently in the scroll?
      var distance = (function() { if(ROOSTER.disabled) { return 999999; } else { return $(window).scrollTop(); }})();
      // Loop to find suns that are within range
      // Iterate through all of the suns each time, because the scroll may have been fast enough compared to the delay, causing some elements to miss getting loaded!
      for(var i = 0, length = this.sun_distances.length; i < length; i++) {
        // Is this element within or over the distance range we're currently at?, and does it still need to be loaded?
        if(distance > this.sun_distances[i] && this.loaded[i] === false) {

          // Current element
          var sun = this.stars.eq(i);
          // Current element's tag name
          var tag = this.stars[i].tagName.toLowerCase();

          // Is this a span that we need to replace with a script, an iframe that needs a src, or an image that needs replaced?
          switch (tag) {

            // SCRIPTS
            case this.script_placeholder:
            // Delete the span element since it is no longer needed as a placeholder
            sun.remove();
            // Create a new script element. NOTE: Adding a new src to a <script> tag doesn't work, so we're using <span> tags as placeholders which gives us access to a distance from the top of the document as well
            var script = document.createElement('script');
            script.type = 'text/javascript';
            script.src = sun.data('sun-script');
            $('body').prepend(script); // Prepend so the page doesn't jump like append does with the jQuery mobile ui script
            break;

            // IFRAMES
            case 'iframe':
            // Grab data-sun source and set it as the real source
            sun.attr('src', sun.data('sun-iframe'));
            break;

            // IMAGES
            default:
            sun.hide().attr('src', sun.data('sun-' + this.image_quality)).fadeIn(this.animation_duration);
          } 

        // Add distance from the top of the document to the next element's distance unless we've loaded everything
        // Since the page's height increases with each added element, we need to add that difference to the next element in the array so it doens't load too early. In this case, we'll just get the current distance from the top and replace it's old distance.
        if (i < length - 1) {
          this.sun_distances[i + 1] = $(this.stars[i + 1]).offset().top - this.viewport_height - this.preload_distance;
          this.loaded[i] = true;
        } else {
        // Since we've iterated over all of the elements several times, we should have loaded previously skipped ones and have finally scrolled far enough to load everything through the end of our stars array.  Mark as done so we don't waste CPU cycles checking anything anymore.
        this.done = true;
      }
    }
  }
      // Allow this function to happen again
      clearTimeout(this.delay);
      this.proceed = true;
    }
  },

  // Set up everything
  init : function(options) {
    // If custom properties were passed in, store them.
    if (typeof options !== 'undefined') {
      if (options.hasOwnProperty('disabled')) { this.disabled = options.disabled; }
      if (options.hasOwnProperty('placeholder')) { this.script_placeholder = options.placeholder; }
      if (options.hasOwnProperty('preload')) { this.preload_distance = options.preload; }
      if (options.hasOwnProperty('delay')) { this.delay_duration = options.delay; }
      if (options.hasOwnProperty('ignore')) { this.ignore = options.ignore; }
      if (options.hasOwnProperty('low')) { this.pixel_ratio_low = options.low; }
      if (options.hasOwnProperty('high')) { this.pixel_ratio_high = options.high; }
      if (options.hasOwnProperty('animate')) { this.animation_duration = options.animate; }
    }
    // Initially set the distances of each data-sun element from the top of the document and post the loaded status for each
    for(var i = 0, length = this.stars.length; i < length; i++) {
      this.sun_distances[i] = $(this.stars[i]).offset().top - this.viewport_height - this.preload_distance;
      this.loaded[i] = false;
    }
    // Set image size to serve based on device pixel ratio or ignore preference
    if (this.ignore || this.pixel_ratio < this.pixel_ratio_medium) {
      this.image_quality = 'default';
    } else if (this.pixel_ratio >= pixel_ratio_high) {
      this.image_quality = 'high';
    } else {
      this.image_quality = 'medium';
    }

    // If lazy-loading is disabled, load all images
    if (this.disabled) { this.load(); }

    // When the user scrolls...
    $(window).on('scroll', function() {
      // Is there no longer a delay?  If so, run the load function and set a new delay.
      if(ROOSTER.proceed) {
        ROOSTER.proceed = false;
        ROOSTER.delay = setTimeout(function() { ROOSTER.load(); }, ROOSTER.delay_duration);
      }
    });
    // On mobile devices, adjust the viewport_height when they change the orientation
    window.addEventListener('orientationchange', function() {
      switch(window.orientation) {  
        case -90:
        case 90:
        ROOSTER.viewport_height = $(window).height();
        break; 
        default:
        ROOSTER.viewport_height = $(window).height();
        break; 
      }
    }, false);
  }
}; // End ROOSTER object.

// Run ROOSTER!
ROOSTER.init();


// ROOSTER.init({
//   Property    Type      Default   Description
//   disabled    boolean   false     A value of "true" loads all images on page load.
//   placeholder string    'span'    For scripts, this element gets replaced by a script tag, but is required to get the needed distance from the top of the document which a script element cannot do.
//   preload     int       0         Preload distance from bottom of viewport in pixels.
//   delay       int       250       Delay in milliseconds between checking for loadable sources (for CPU load).
//   ignore      boolean   false     A value of "true" ignores the pixel ratio and only loads the "data-sun-default" images, otherwise they will only load if they are below the "medium" pixel ratio.
//   medium      int/float 1.5       Serves the "data-sun-medium" images if the pixel ratio is >= to this and < the high.
//   high        int/float 2         Serves the "data-sun-high" images if the pixel ratio is >= to this.
//   animate     int       1000      jQuery fadeIn animation duration in milliseconds (only applies to images).
// });
