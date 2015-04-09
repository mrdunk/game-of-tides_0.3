/* global xtag */

document.addEventListener('WebComponentsReady',function(){
  'use strict';
  var childItterator, sectionContent;

  xtag.register('x-window', {
    // extend existing elements
    lifecycle:{
      created: function(){
        console.log(' *** x-window.lifecycle.created *** ');
        // fired once at the time a component
        // is initially created or parsed
        xtag.innerHTML(this, '<x-window-header title="' + this.title + '"></x-window-header><x-window-content></<x-window-content>');
        for(childItterator in this.children){
            if(this.children[childItterator].tagName === 'X-WINDOW-CONTENT'){
                sectionContent = this.children[childItterator];
            }
          }
      },
      inserted: function(){
        console.log(' *** x-window.lifecycle.inserted *** ');
        // fired each time a component
        // is inserted into the DOM
      },
      removed: function(){
        // fired each time an element
        // is removed from DOM
      },
      attributeChanged: function(){
        // fired when attributes are set
      }
    },
    accessors: {
      contents: {
        attribute: {
          var: [1,2]
        },
        get: function(){
          console.log('contents.get');
        },
        set: function(value){
          sectionContent.setAttribute('contents', value);
        }
      }
    },
    methods: {
      toggleMinimize: function(){
        if(this.className === 'x-window-min'){
          this.className = 'x-window-max';
          sectionContent.style.display = 'block';
        } else {
          this.className = 'x-window-min';
          sectionContent.style.display = 'none';
        }
      }
    }
  });


  xtag.register('x-window-header', {
    // extend existing elements
    lifecycle:{
      created: function(){
        // fired once at the time a component
        // is initially created or parsed
        xtag.innerHTML(this, '<x-window-button></x-window-button>' + this.title);
      }
    }
  });

  xtag.register('x-window-button', {
    // extend existing elements
    lifecycle:{
      created: function(){
        // fired once at the time a component
        // is initially created or parsed
        xtag.innerHTML(this, '<i class="fa fa-minus-square"></i>');
      }
    },
    events: {
      'click:delegate(x-window)': function(){
        // activate a clicked toggler
        console.log('click button!');
        this.toggleMinimize();
      }
    }
  });

  xtag.register('x-window-content', {
    // extend existing elements
    lifecycle:{
      created: function(){
        // fired once at the time a component
        // is initially created or parsed
        this.container = {};
        this.update();
      }
    },
    accessors: {
      contents: {
        attribute: {
          var: [1,2]
        },
        get: function(){
          // return all toggler children
          console.log('contents.get');
        },
        set: function(value){
          // set the toggler children
          if(typeof value === 'string'){
            value = value.split(',');
          }
          this.container[value[0]] = value[1];
          this.update();
        }
      }
    },
    methods: {
      update: function(){
          var outHtml = '<dl>';
          for(var key in this.container){
            outHtml += '<dt>' + key + '</dt>';
            outHtml += '<dd>' + this.container[key] + '</dd>';
          }
          outHtml += '</dl>';
          xtag.innerHTML(this, outHtml);
      }
    }
  });

});
