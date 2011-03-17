
function getPainting1(){

    var painting1 = {
        title_: 'Skrik',
        title_en: 'The Scream',
        width_: 91,
        height_: 73.4
    }
    painting1 = tent.clone(painting1, {
		dom: true,
        deep: true,
        onlyForTracking: true
    });
    
    return painting1;
    
}

TestCase("ContextNoTypeTest", {

    testAttachAndModify: function(){
    
        var painting1 = getPainting1();
        
        var ctx = new tent.entities.Context(true);
        
        ctx.attach(painting1);
        
        // attached without changes
        assertFalse(ctx.hasChanges());
        assertEquals(1, ctx._Object.items.length);
        assertSame(painting1, ctx._Object.items[0]);
        assertEquals(tent.entities.ChangeStates.UNCHANGED, painting1.__changeState__);
        
        painting1.height_ = 73.5;
        
        // assert modify detected
        assertTrue(ctx.hasChanges());
        assertEquals(1, ctx.changes.items.length);
        assertSame(painting1, ctx.changes.items[0]);
        assertEquals(tent.entities.ChangeStates.MODIFIED, painting1.__changeState__);
        
    },
    
    testAddNewAndModify: function(){
    
        var painting1 = getPainting1();
        
        var ctx = new tent.entities.Context(true);
        
        ctx.push(painting1);
        
        // attached as new
        assertTrue(ctx.hasChanges());
        assertEquals(1, ctx._Object.items.length);
        assertSame(painting1, ctx._Object.items[0]);
        assertEquals(1, ctx.changes.items.length);
        assertSame(painting1, ctx.changes.items[0]);
        assertEquals(tent.entities.ChangeStates.ADDED, painting1.__changeState__);
        
        
        painting1.height_ = 73.5;
        
        // assert that still ADDED
        assertEquals(1, ctx.changes.items.length);
        assertSame(painting1, ctx.changes.items[0]);
        assertEquals(tent.entities.ChangeStates.ADDED, painting1.__changeState__);
        
    },
    
    testAddNewAndDelete: function(){
    
        var painting1 = getPainting1();
        
        var ctx = new tent.entities.Context(true);
        
        ctx.push(painting1);
        
        ctx.remove(painting1);
        
        // assert item removed
        assertEquals(0, ctx._Object.items.length);
        assertEquals(0, ctx.changes.items.length);
        assertEquals(tent.entities.ChangeStates.DETACHED, painting1.__changeState__);
        
    },
    
    testAttachAndDelete: function(){
    
        var painting1 = getPainting1();
        
        var ctx = new tent.entities.Context(true);
        
        ctx.attach(painting1);
        
        ctx.remove(painting1);
        
        // assert item removed
        assertEquals(0, ctx._Object.items.length);
        assertEquals(1, ctx.changes.items.length);
        assertSame(painting1, ctx.changes.items[0]);
        assertEquals(tent.entities.ChangeStates.DELETED, painting1.__changeState__);
        
    },
    
    testAttachAsDeleted: function(){
    
        var painting1 = getPainting1();
        
        var ctx = new tent.entities.Context(true);
        
        painting1.__changeState__ = tent.entities.ChangeStates.DELETED;
        ctx.attach(painting1);
        
        // assert item deleted
        assertEquals(0, ctx._Object.items.length);
        assertEquals(1, ctx.changes.items.length);
        assertSame(painting1, ctx.changes.items[0]);
        assertEquals(tent.entities.ChangeStates.DELETED, painting1.__changeState__);
        
    },
    
    testAttachAsModified: function(){
    
        var painting1 = getPainting1();
        
        var ctx = new tent.entities.Context(true);
        
        painting1.__changeState__ = tent.entities.ChangeStates.MODIFIED;
        ctx.attach(painting1);
        
        // assert item deleted
        assertEquals(1, ctx._Object.items.length);
        assertEquals(1, ctx.changes.items.length);
        assertSame(painting1, ctx.changes.items[0]);
        assertEquals(tent.entities.ChangeStates.MODIFIED, painting1.__changeState__);
        
    }
    
});
