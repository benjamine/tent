
var buildTestData = function(){
    var d = {};
    
    d.Father = new tent.changes.reverseProperties.Set({
        children_: {
            cardinality: '1n',
            reverse: 'parent'
        }
    });
    
    d.Child = new tent.changes.reverseProperties.Set({
        parent: {
            cardinality: 'n1',
            reverse: 'children_'
        }
    });
    
    d.data = {};
    
    d.data.father1 = {
        name: 'mateo'
    };
    d.data.father2 = {
        name: 'lea'
    };
    d.data.child1 = {
        name: 'junior'
    };
    d.data.child2 = {
        name: 'maisa'
    };
    d.data.child3 = {
        name: 'manuk'
    };
    d.data.child4 = {
        name: 'chiche'
    };
    
    d.data = tent.clone(d.data, {
		dom: true,
        deep: true,
        onlyForTracking: true
    });
    
    d.Father.applyTo(d.data.father1, d.data.father2).bind({
        log: true
    });
    
    d.Child.applyTo(d.data.child1, d.data.child2, d.data.child3, d.data.child4).bind({
        log: true
    });
    
    return d;
};

TestCase("ReversePropertiesTest", {

    testBidirectional1N_AddRemove: function(){
    
        var d = buildTestData();
        
        // no childrens yet
        assertInstanceOf(Array, d.data.father1.children_);
        assertInstanceOf(Array, d.data.father2.children_);
        
        assertEquals(0, d.data.father1.children_.length);
        assertEquals(0, d.data.father2.children_.length);
        assertNull(d.data.child1.parent);
        assertNull(d.data.child2.parent);
        assertNull(d.data.child3.parent);
        assertNull(d.data.child4.parent);
        
        assertInstanceOf(tent.changes.Observable, d.data.child2.__observable__);
        assertNotNull(d.data.child2.__observable__.interceptors.parent);
        
        d.data.child2.parent = d.data.father1;
        
        assertEquals(1, d.data.father1.children_.length);
        d.data.father1.children_.push(d.data.child3);
        
        assertEquals(2, d.data.father1.children_.length);
        d.data.father1.children_.splice(0, 0, d.data.child1);
        assertEquals(3, d.data.father1.children_.length);
        
        // child1,child2,child3 children_ of father1
        assertSame(d.data.father1, d.data.child1.parent);
        assertSame(d.data.father1, d.data.child2.parent);
        assertSame(d.data.father1, d.data.child3.parent);
        assertSame(d.data.child1, d.data.father1.children_[0]);
        assertSame(d.data.child2, d.data.father1.children_[1]);
        assertSame(d.data.child3, d.data.father1.children_[2]);
        
        // replace child2 with child4
        d.data.father1.children_.splice(1, 1, d.data.child4);
        
        // child1,child4,child3 children_ of father1
        assertEquals(3, d.data.father1.children_.length);
        assertSame(d.data.father1, d.data.child1.parent);
        assertSame(d.data.father1, d.data.child4.parent);
        assertSame(d.data.father1, d.data.child3.parent);
        assertNull(d.data.child2.parent);
        assertSame(d.data.child1, d.data.father1.children_[0]);
        assertSame(d.data.child4, d.data.father1.children_[1]);
        assertSame(d.data.child3, d.data.father1.children_[2]);
        
        // remove child1, child4        
        d.data.child4.parent = null;
        d.data.father1.children_.remove(d.data.child1);
        
        // child3 child of father1
        assertEquals(1, d.data.father1.children_.length);
        assertSame(d.data.father1, d.data.child3.parent);
        assertNull(d.data.child4.parent);
        assertNull(d.data.child1.parent);
        assertSame(d.data.child3, d.data.father1.children_[0]);
        
        assertNotNull(d.data.father1.children_.__parent__);
        assertNotNull(d.data.father1.children_.__reverseProperty__);
        
        // remove child3
        d.data.father1.children_.pop();
        
        // child3 child of father1
        assertEquals(0, d.data.father1.children_.length);
        assertNull(d.data.child3.parent);
        
    },
    
    testBidirectional1N_ChangeParent: function(){
    
        var d = buildTestData();
        
        d.data.father1.children_.push(d.data.child1);
        
        // child1 child of father1
        assertEquals(1, d.data.father1.children_.length);
        assertEquals(0, d.data.father2.children_.length);
        assertSame(d.data.father1, d.data.child1.parent);
        assertSame(d.data.child1, d.data.father1.children_[0]);
        
        // change child1 parent to father2
        d.data.child1.parent = d.data.father2;
        
        // child1 child of father2
        assertEquals(0, d.data.father1.children_.length);
        assertEquals(1, d.data.father2.children_.length);
        assertSame(d.data.father2, d.data.child1.parent);
        assertSame(d.data.child1, d.data.father2.children_[0]);
        
        // change child1 parent to father1 -> error, it already belongs to father2
        assertException(d.data.father1.children_.push(d.data.child1));
        d.data.father1.children_.remove(d.data.child1);
        
        // remove from father2 first, then add to father1
        d.data.father2.children_.remove(d.data.child1);
        d.data.father1.children_.push(d.data.child1);
        
        // child1 child of father1
        assertEquals(1, d.data.father1.children_.length);
        assertEquals(0, d.data.father2.children_.length);
        assertSame(d.data.father1, d.data.child1.parent);
        assertSame(d.data.child1, d.data.father1.children_[0]);
        
    }
});
