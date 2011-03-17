
TestCase("ContextRela11Test", {

    testRela11_OnLinkPush: function(){
    
        var data = {};
        
        data.artist1 = {
            name: 'Frida Kahlo',
            birthdate: new Date(1907, 7, 6),
            nationality: 'Mexican'
        }
        
        data.artist2 = {
            name: 'Diego Rivera',
            nationality: 'Mexican'
        }
        
        data = tent.clone(data, {
			dom: true,
            deep: true,
            onlyForTracking: true
        });
        
        var ctx = new tent.entities.Context(true);
        
        ctx.push(new tent.entities.Type('Person', {
            name: {},
            birthdate: {},
            nationality: {},
            spouse: {
                reverse: 'spouse',
                collection: 'Person',
                onLinkPush: true,
                onUnlinkRemove: true
            }
        }));
        
        ctx.Person.push(data.artist1);
        
        // 1 person added as new
        
        // no links yet
        assertNull(data.artist1.spouse);
        assertUndefined(data.artist2.spouse);
        
        ctx.acceptAllChanges();

        // marry
        data.artist1.spouse = data.artist2;

        // assert link is synced
        assertSame(data.artist2, data.artist1.spouse);

        assertSame(data.artist1, data.artist2.spouse);

        // assert new person is added 
        assertTrue(ctx.hasChanges());
        assertEquals(2, ctx.changes.items.length);
        assertEquals(2, ctx.Person.items.length);

        assertSame(data.artist1, ctx.changes.items[0]);
        assertSame(data.artist2, ctx.changes.items[1]);
        assertSame(data.artist1, ctx.Person.items[0]);
        assertSame(data.artist2, ctx.Person.items[1]);

        assertEquals(tent.entities.ChangeStates.MODIFIED, data.artist1.__changeState__);
        assertEquals(tent.entities.ChangeStates.ADDED, data.artist2.__changeState__);

    },
    
    testRela11_OnUnlinkRemove: function(){
    
        var data = {};
        data.artist1 = {
            name: 'Frida Kahlo',
            birthdate: new Date(1907, 7, 6),
            nationality: 'Mexican'
        }
        
        data.artist2 = {
            name: 'Diego Rivera',
            nationality: 'Mexican'
        }
        
        data = tent.clone(data, {
			dom: true,
            deep: true,
            onlyForTracking: true
        });
        
        var ctx = new tent.entities.Context(true);
        
        ctx.push(new tent.entities.Type('Person', {
            name: {},
            birthdate: {},
            nationality: {},
            spouse: {
                reverse: 'spouse',
                collection: 'Person',
                onLinkPush: true,
                onUnlinkRemove: true
            }
        }));
        
        ctx.Person.push(data.artist1);
        
        // no links yet
        
        // marry
        data.artist1.spouse = data.artist2;
        
        ctx.acceptAllChanges();
        
        // divorce
        data.artist2.spouse = null;
        
        // assert link is synced
        assertNull(data.artist1.spouse);
        assertNull(data.artist2.spouse);
        
        // assert person is deleted 
        assertTrue(ctx.hasChanges());
        assertEquals(tent.entities.ChangeStates.DELETED, data.artist1.__changeState__);
        assertEquals(tent.entities.ChangeStates.MODIFIED, data.artist2.__changeState__);
        assertEquals(1, ctx.Person.items.length);
        assertEquals(2, ctx.changes.items.length);
        assertSame(data.artist2, ctx.changes.items[0]);
        assertSame(data.artist1, ctx.changes.items[1]);
        
    },
    
    testRela11_CascadePush: function(){
    
        var data = {};
        data.artist1 = {
            name: 'Frida Kahlo',
            birthdate: new Date(1907, 7, 6),
            nationality: 'Mexican'
        }
        
        data.artist2 = {
            name: 'Diego Rivera',
            nationality: 'Mexican'
        }
        
        data = tent.clone(data, {
			dom: true,
            deep: true,
            onlyForTracking: true
        });
        
        var ctx = new tent.entities.Context(true);
        
        ctx.push(new tent.entities.Type('Person', {
            name: {},
            birthdate: {},
            nationality: {},
            spouse: {
                reverse: 'spouse',
                collection: 'Person',
                cascadePush: true,
                cascadeRemove: true
            }
        }));
        
        ctx.Person.type.applyTo(data.artist1, data.artist2);
        data.artist2.spouse = data.artist1;
        
        ctx.push(data.artist2);
        
        // 2 person added as new
        assertTrue(ctx.hasChanges());
        assertEquals(2, ctx.Person.items.length);
        assertSame(data.artist2, ctx.Person.items[0]);
        assertSame(data.artist1, ctx.Person.items[1]);
        assertEquals(tent.entities.ChangeStates.ADDED, data.artist1.__changeState__);
        assertEquals(tent.entities.ChangeStates.ADDED, data.artist2.__changeState__);
        
    },
    
    testRela11_CascadeRemove: function(){
    
        var data = {};
        data.artist1 = {
            name: 'Frida Kahlo',
            birthdate: new Date(1907, 7, 6),
            nationality: 'Mexican'
        }
        
        data.artist2 = {
            name: 'Diego Rivera',
            nationality: 'Mexican'
        }
        
        data = tent.clone(data, {
			dom: true,
            deep: true,
            onlyForTracking: true
        });
        
        var ctx = new tent.entities.Context(true);
        
        ctx.push(new tent.entities.Type('Person', {
            name: {},
            birthdate: {},
            nationality: {},
            spouse: {
                reverse: 'spouse',
                collection: 'Person',
                cascadePush: true,
                onLinkPush: true,
                cascadeRemove: true
            }
        }));
        
        ctx.Person.type.applyTo(data.artist1, data.artist2);
        
        ctx.push(data.artist2);
        
        data.artist2.spouse = data.artist1;
        
        ctx.acceptAllChanges();
        ctx.remove(data.artist1);
        
        // 2 person removed
        assertTrue(ctx.hasChanges());
        assertEquals(0, ctx.Person.items.length);
        assertEquals(tent.entities.ChangeStates.DELETED, data.artist1.__changeState__);
        assertEquals(tent.entities.ChangeStates.DELETED, data.artist2.__changeState__);
        assertSame(data.artist1, ctx.changes.items[0]);
        assertSame(data.artist2, ctx.changes.items[1]);
        
    }
    
});
