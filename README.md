Tent
=========

*A **T**iny **Ent**ity JavaScript framework*

Tent is a JavaScript framework that aims to ease working with tool-agnostic entity data models (ie: simple objects and arrays) providing change tracking and relationship handling.

- Tent implements Javascript **change tracking** on object properties and array contents (insertions and deletions). This could serve multiple purposes as logging, debugging, databinding, forcing constraints, etc.
- In top of this there's **reverse-property synchronization** for 1:1, 1:N and N:M relationships.
- In top of both Tent provides Entity Contexts that support the **Unit Of Work** pattern for data manipulation, common in modern ORMs.

 1. Create a Context and (optionally) define Entity Types 
 - Use your preferred mechanism to load objects and attach them to the Context (eg: ajax GET request)
 - Manipulate objects (change property values, add/remove from arrays), note that this step is completely framework ignorant*.
 - Commit all changes registered by the Context using your preferred persistance mechanism** (eg: ajax POST request)
 - (optionally) Mark changes as accepted and go back to step 3. 

 \* *Actually, the only limitation for object manipulation is the Array length property, because there's no cross-browser consistent support for detecting when the length property is set.*

 \** *In future versions step 3 may occur simultaneously with steps 4 or 5, as in many offline editing applications with a background auto-saving process.*

---------------


Targeted platforms
----------------

Tent is currently tested on the following platforms:

* Chrome 10 Windows
* Opera 9.80 Windows
* Safari 533.19.4 Windows
* Firefox 4.0 Windows
* IE 8.0 Windows

[js-test-driver](http://code.google.com/p/js-test-driver/) is used for unit testing, so other browsers could be easily added. 

IE7 is supported, but most unit test won't work on it. IE7 doesn't provide any change tracking solution, so property changing must allways be done using tent.pset/pget functions, ie:

	var customer = { name: 'John Smith', age: 35 };
	var ctx = new tent.entities.Context(true);
	ctx.push(customer);
	
	customer.age = 45; // WRONG: change is not detected
	tent.pset(customer, 'age', 46); // RIGHT: change is detected

	console.log(tent.pget(customer, 'age')); // prints '46'
	
change tracking support can be obtained using:

	console.log(tent.changes.getPropertyInterceptMode()); // member of tent.changes.PropertyInterceptModes Enum
	console.log(tent.changes.getPropertyInterceptModeName());
	// prints 'DEFINEPROPERTY' on most modern browsers, Chrome, FF, etc.
	// prints 'DEFINEPROPERTYONLYDOM' on IE8, change tracking only on DOM objects, you can use tent.domClone() to clone your entities as DOM objects
	// prints 'NONE' on IE7, use tent.pset()/tent.pget() when changing/reading properties.

Including Tent in my application
---------------

To use Tent in your application, download the latest release from the 
Tent web site (_under construction_) and copy 
`dist/tent.js` or `dist/tent.min.js` (minified) to a suitable location. Then include it in your HTML
like so:

    <script type="text/javascript" src="/path/to/tent.min.js"></script>
	
Note: you can also use Tent on Browserless Javascript environments (as [Node.js](http://nodejs.org/)) referencing tent.min.js. 

Using Tent
---------------

A typical Tent workflow may include some or all of these steps:

1. Create entities as plain objects and arrays, eg: `  var person1 = {}; var person.contacts = []; `, or with any other third-party framework as [Prototype](http://www.prototypejs.org/), eg: ` var person1 = new Person(); `.
- Create a Change-Tracking Context and attach entities, eg: ` var ctx = new Tent.Entities.Context(); ctx.attach(person1);`
- Manipulate entities as regular javascript objects and arrays, eg: ` person1.name = 'john'; person1.friends.push(person2);`
- Add new entities to the Context directly, eg: `ctx.push(person45 = new Person('George'));`, or by cascade pushing, eg: `person1.spokenLanguages.push(new Language('zh');`
- Remove entities from the Context directly, eg: `ctx.remove(person45);`, or by cascade removing, eg: `person1.spokenLanguages.splice(0,3);`
- Subscribe to notifications on a per-object basis (eg. logging, debugging, forcing constraints, etc.) of:
 - Property value changes `person1.name = 'john';`
 - Array adds and removes `person1.addresses.push(mail2); person1.addresses.splice(0,1);` (all Javascript Array functions are supported)
- Get all changes tracked in the Context `ctx.changes` (activate, suspend and resume tracking supported).
- Get reverse relationship properties synced, eg. after `person1.friends.push(person2);` you get `person2.friends.indexOf(person1) >= 0;` or after `city1.country = country2;` you get `country2.cities.indexOf(city1) >= 0;`
- Group entities in Entity Types that define:
 - Properties for change tracking
 - Reverse Properties with their cardinality (1:1, 1:N, N:1 or N:M), reverse Entity Type, and cascading options (cascade push, cascade remove, push on link, remove on unlink).
 - Tracking of added/removed entity links (particularly useful for N:M relationships)
 - Entity Type example: `        ctx.push(
            new Entities.Type('Country', {
                name: {},
                cities: {
                    cardinality: '1N',
                    reverse: 'country',
                    collection: 'City',
                    cascadePush: true,
                    cascadeRemove: true,
                    onLinkPush: true,
                    onUnlinkRemove: true
                }
            })
        );`
- Or use "untyped" javascript objects, all properties are tracked by default (without Entity Types relationships are not supported)
- Eventually (eg: on data manipulation completion (see Unit of Work Pattern) or periodic "auto-saves"), persist changes (tracked in your Context `ctx.changes`) using your preferred persistence mechanism (eg. an ajax service call, HTML5 Isolated Storage)
- Optionally, call to `ctx.acceptChanges();` to continue manipulating data (go back to step 3).



### Building Tent from source ###

`tent.js` is a composite file generated from many source files in the `src/` directory. To build Tent, you'll need:

* a copy of the Tent source tree, either from a distribution tarball or from the Git repository (see below)

Google Closure Compiler is used to build tent.js, and tent.min.js (minified version).

	java -jar closure-compiler\compiler.jar --js src\base.js --js src\arrays.js --js src\coretypes.js --js src\logging.js --js src\changes.js --js src\databinding.js --js src\changes.reverseproperties.js --js src\entities.js --js_output_file=dist\tent.js --compilation_level WHITESPACE_ONLY --formatting PRETTY_PRINT

	java -jar closure-compiler\compiler.jar --js src\base.js --js src\arrays.js --js src\coretypes.js --js src\logging.js --js src\changes.js --js src\databinding.js --js src\changes.reverseproperties.js --js src\entities.js --js_output_file=dist\tent.min.js

Note: currently I'm developing this project under Windows (using Aptana IDE), so I use some .bat files to run builds and unit tests, cross-platform commands may be added later.

### Running Unit Tests ###

Unit tests are written for [js-test-driver](http://code.google.com/p/js-test-driver/). 
Configuration files provided:
- JsTestDriver.conf default, uses files in the src folder
- JsTestDriver-coverage.conf reports code coverage
- JsTestDriver-dist.conf uses minified dist file

I'm using js-test-driver Eclipse plugin to run tests on Aptana IDE

__Disclaimer__: At this moment, coverage is pretty low, and as this is my first attempt to create a fully unit-tested project, most tests need some serious refactoring :)

Documentation
-------------

Besides this readme, it's under construction.
I'm starting to write some Quick-Start Guides in the form of Unit Test Cases (I want to mantain all documentation as concise and runnable as posible)
