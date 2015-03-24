//(function(xtag) {
document.addEventListener('WebComponentsReady',function(){
  'use strict';
  var childItterator;

  xtag.register('x-window', {
    // extend existing elements
    lifecycle:{
      created: function(){
        console.log(" *** x-window.lifecycle.created *** ");
        // fired once at the time a component
        // is initially created or parsed
        xtag.innerHTML(this, '<x-window-header title="' + this.title + '"></x-window-header><x-window-content></<x-window-content>');
      },
      inserted: function(){
        console.log(" *** x-window.lifecycle.inserted *** ");
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
    methods: {
      toggleMinimize: function(){
        if(this.className === 'x-window-min'){
          this.className = 'x-window-max';
          for(childItterator in this.children){
            if(this.children[childItterator].tagName === 'X-WINDOW-CONTENT'){
                this.children[childItterator].style.display = 'block';
            }
          }
        } else {
          this.className = 'x-window-min';
          for(childItterator in this.children){
            if(this.children[childItterator].tagName === 'X-WINDOW-CONTENT'){
                this.children[childItterator].style.display = 'none';
            }
          }          
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
        console.log('click!');
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
        xtag.innerHTML(this, 'content');
      }
    },
    events: {
      'click:delegate(x-window)': function(){
        // activate a clicked toggler
        console.log('click!');
        this.toggleMinimize();
      }
    }
  });

});
