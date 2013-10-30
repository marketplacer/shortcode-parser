
var fs = require('fs');
var vows = require('vows');
var util = require('util');
var assert = require('assert');
var shortcode = require('../src/shortcode-parser.js');

var text = fs.readFileSync('test/fixtures/shortcodes.txt', 'utf8');

process.on('uncaughtException', function(err) {
  console.log(err.stack);
  process.exit();
});

vows.describe("Shortcode Parser").addBatch({
  
  'Shortcode Handlers': {
    
    topic: function() {
      
      var result = {};
      
      var inline, container, params_test, bold, infinite_loop_test;
      
      shortcode.add('inline', inline = function(buf, opts) {
        return util.format('<!-- inline/ buf: "%s" opts: %s -->', buf, JSON.stringify(opts));
      });
      
      shortcode.add('container', container = function(buf, opts) {
        return util.format('<!-- container opts: %s -->%s<!-- /container -->', JSON.stringify(opts), buf);
      });
      
      shortcode.add('params_test', params_test = function(buf, opts) {
        
        var types = {
          hello: (opts.hello === "world") ? util.format('string(%s)', opts.hello) : null,
          foo: (opts.foo === 'a-b-c-d') ? util.format('string(%s)', opts.foo) : null,
          name: (opts.name === 'john1234') ? util.format('string(%s)', opts.name) : null,
          some: (opts.some === 'value') ? util.format('string(%s)', opts.some) : null,
          another: (opts.another === 'Lorem Ipsum Dolor Sit Amet') ? util.format('string(%s)', opts.another) : null,
          age: (opts.age === 30) ? util.format('number(%d)', opts.age) : null,
          float: (opts.float === 55.5) ? util.format('float(%s)', opts.float) : null,
          slider: (opts.slider === null) ? util.format('null(%s)', opts.slider) : null,
          boolean: (opts.boolean === true) ? util.format('boolean(%s)', opts.boolean) : null,
          other: (opts.other === undefined) ? util.format('undefined(%s)', opts.other) : null
        }
        
        for (var key in types) {
          if (types[key] === null) throw new Error(util.format("Bad value on param_test: %s=%s", key, opts[key]));
        }
        
        return util.format('<!-- params_test / buf: "%s" opts: %s types: %s -->', buf, JSON.stringify(opts), JSON.stringify(types));
        
      });
      
      shortcode.add('bold', bold = function(buf, opts) {
        return util.format('<strong style="font-size: %s; font-family: \'%s\',sans-serif;">%s</strong>', opts.size, opts.font, buf);
      });
      
      shortcode.add('infinite_loop_test', infinite_loop_test = function(buf, opts) {
        return '<!-- infinite_loop_test / [infinite_loop_test] * [infinite_loop_test /] [infinite_loop_test][/infinite_loop_test] -->';
      });

      return {
        inline: inline,
        container: container,
        params_test: params_test,
        bold: bold,
        infinite_loop_test: infinite_loop_test
      }
      
    },
    
    "Adds shortcode handlers": function(val) {
      assert.deepEqual(val, shortcode._shortcodes);
    },
    
    "Removes shortcode handlers": function(val) {
      var noop = function() {};
      shortcode.add('test', noop);
      assert.isFunction(shortcode._shortcodes.test, noop);
      shortcode.remove('test', noop);
      assert.deepEqual(val, shortcode._shortcodes);
    }
    
  },
  
  'Rendering Shortcodes': {
    
    topic: function() {
      return shortcode.parse(text);
    },
    
    'Renders shortcodes property': function(buf) {
      var output = fs.readFileSync('test/fixtures/output.txt', 'utf8');
      assert.strictEqual(buf, output);
    },
    
    'Renders using custom context': function() {
      var out = shortcode.parse('This is [bold size=2em font="Helvetica"]Some Text[/bold] and [u upper]Some more Text[/u] and [u]Something[/u]...', {
        u: function(buf, opts) {
          if (opts.upper) buf = buf.toUpperCase();
          return util.format('<u>%s</u>', buf);
        }
      });
      assert.strictEqual(out, 'This is [bold size=2em font="Helvetica"]Some Text[/bold] and <u>SOME MORE TEXT</u> and <u>Something</u>...');
    },
    
    'Avoids infinite loops': function() {
      var out = shortcode.parse('[infinite_loop_test]');
      assert.strictEqual(out, '<!-- infinite_loop_test / [infinite_loop_test] * [infinite_loop_test /] [infinite_loop_test][/infinite_loop_test] -->');
    }
    
  }
  
}).export(module);