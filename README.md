TypeSmart
=========
TypeSmart is an extensible and customizable framework for making textareas and contenteditable elements “smart”.
TypeSmart was built with the intention to bring typographic niceties to on-page editing spaces.

#### Features
- **“Smart quotes”** instead of **"dumb quotes"**.
- Automatic ellipsis (…) instead of three periods (...).
- Automatic em-dash (—) instead of minus minus (--).
- Correct apostrophe: **Don't** use straight quotes for apostrophe. Just **don’t**!

#### Using TypeSmart
```html
<!-- Source TypeSmart into your page. -->
<script
   type='text/javascript'
   src='//sujeet.github.io/typesmart.js/typesmart.js'>
</script>

<!-- Make editing areas smart by adding the classes
     'typeSmart' and 'typeSmartTypography' to them. -->
<textarea class='typeSmart typeSmartTypography'></textarea>
<div contenteditable='true' class='typeSmart typeSmartTypography'></div>

<!-- Activate TypeSmart by including the following just before </body> tag. -->
<script type='text/javascript'>
  TypeSmart.init();
</script>
```

#### Customizing TypeSmart
```html
<!-- Before initializing TypeSmart,
     you can define certain variables to extend TypeSmart 
     1) my_replacements     : Replace a string by another.
                              (workes for typed as well as pasted text)
     2) my_paste_modifiers  : Functions to modify text when it is pasted into.   
                              (only for pasted text)
     3) my_custom_triggers  : Functions to be executed after typing certain text.
                              (only for typed text)
-->
<script type='text/javascript'>
  TypeSmart.my_replacements = {
    'typeSmartGreetings': {
      '/greet': 'Hello!',
      '/farewell': 'Bye!'
    },
    'typeSmartRandom': {
      '<foo>': 'BAR'
    }
  };
  // The greetings will work in all editable areas who have 'typeSmartGreetings' class.
  // For example, in the following textarea,
  // <textarea class='typeSmart typeSmartGreetings typeSmartTypography'><textarea>
  // in addition to typographical features, the following will happen:
  // - Whenever you type '/greet' it will be replaced by 'Hello!'
  // - Whenever pasted text has '/greet', it will get replaced by 'Hello!'
  
  TypeSmart.my_paste_modifiers = {
    'typeSmartUppperCasePaste': {
      'this string can be anything (should be unique)':
           (function (text) {return text.toUpperCase();})
    },
    'typeSmartLowerCasePaste' : {
      'make the text lowercase': (function (text) {return text.toLowerCase();})
    }
  };
  // For example, whenever some text is pasted into
  // <span contenteditable='true' class='typeSmart typeSmartCaseModPaste'></span>
  // instead of the original text, an all-caps version of the text will be pasted.
  //
  // Function signature : Takes one string argument (pasted text) and returns one
  //                      string (text to be actually pasted)
  
  TypeSmart.insertRandomgreeting = function () {
    var greetings = ['hello',
                     'hola',
                     'namaste',
                     'hi',
                     'greetings'];
    var random_greeting = greetings [Math.floor(Math.random() * greetings.length)];
    
    // Now insert the greeting at the cursor position
    Cursor.new().insert(random_greeting + "!");
    return false;
  }
  
  TypeSmart.my_custom_triggers = {
    'typeSmartCommands': {
      '/randomGreeting': TypeSmart.insertRandomgreeting,
      '?!': (function () {Cursor.new().deleteBackward(1); return true;})
    }
  };
  // Whenever /randomGreeting is typed, it will be replaced by a random greeting
  // instead. To enable this, class 'typeSmartCommands' should be added to
  // the editing area.
  //
  // Function signature: Takes no arguments.
  //                     Should do whatever needs to be done 
  //                     (inserting a random greeting in this case)
  //                     Should return false indicating that the last typed
  //                     character (here, 'g'), should not appear in editing area
  //                     Should return true if the last typed letter is intended
  //                     to appear. For example, the '?!' function deletes the
  //                     character immediately before '?', but also lets the
  //                     '!' to appear. So typing "reallyy?!" would actually
  //                     result in "really!".
  
  TypeSmart.init();
</script>
```
