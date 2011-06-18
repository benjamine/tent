
TestCase("NamespaceTest", {

    testCreateNamespace: function(){
    
        tent.declare('TestLibraries.Examples.Example1');
        tent.declare('TestLibraries.Examples.Example2');
        
        assertNotNull(TestLibraries);
        assertNotNull(TestLibraries.Examples);
        assertTrue(TestLibraries.Examples.Example1.name == 'Example1');
        assertTrue(TestLibraries.Examples.Example1.fullname == 'TestLibraries.Examples.Example1');
        
        assertSame(TestLibraries.Examples, TestLibraries.Examples.Example1.parent);
        assertSame(TestLibraries.Examples, TestLibraries.Examples.Example2.parent);
        assertSame(TestLibraries, TestLibraries.Examples.parent);
        assertSame(window, TestLibraries.parent);
        
    },
    
    testExpandNamespace: function(){
    
        tent.declare('TestLibraries.Examples');
        
        tent.declare('TestLibraries.Examples.Example1', function(exports){
            exports.Name = "Juan";
            exports.Hello = function(){
                return 'Hello ' + exports.Name;
            }
        });
        
        tent.declare('TestLibraries.Examples.Example1', function(exports){
            exports.Goodbye = function(){
                return 'Goodbye ' + exports.Name;
            }
        });
        
        assertEquals('Hello Juan', TestLibraries.Examples.Example1.Hello());
        TestLibraries.Examples.Example1.Name = 'Jose';
        assertEquals('Goodbye Jose', TestLibraries.Examples.Example1.Goodbye());
        
    }
    
});
