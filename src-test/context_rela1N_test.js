
TestCase("ContextRela1NTest", {

    testRela1N_OnLinkPush: function(){
    
        var artist1 = {
            name: 'Frida Kahlo',
            birthdate: new Date(1907, 7, 6),
            nationality: 'Mexican'
        }
        
        var painting1 = {
            title: 'Autorretrato con Changuito',
            width: 34.5,
            height: 39.5
        }
        
        var painting2 = {
            title: 'Frutos de la Tierra',
            width: 60,
            height: 40.6
        }

        var ctx = new tent.entities.Context(true);
        
        ctx.push(new tent.entities.Type('Artist', {
            name: {},
            birthdate: {},
            nationality: {},
            paintings: {
                cardinality: '1N',
                reverse: 'artist',
                collection: 'Painting',
                cascadePush: true,
                cascadeRemove: true,
                onLinkPush: true,
                onUnlinkRemove: true
            }
        }), new tent.entities.Type('Painting', {
            title: {},
            width: {},
            height: {},
            artist: {
                cardinality: 'N1',
                reverse: 'paintings',
                collection: 'Artist',
                cascadePush: true,
                onLinkPush: true
            }
        }));

        ctx.Artist.push(artist1);

        // no links yet
        assertArray(artist1.paintings);

        assertEquals(0, artist1.paintings.length);

        assertUndefined(painting1.artist);

        assertUndefined(painting2.artist);

        ctx.acceptChanges();

        // add children
        artist1.paintings.push(painting1, painting2);
        
        // assert link is synced
        assertSame(painting1, artist1.paintings[0]);
        assertSame(painting2, artist1.paintings[1]);
        assertSame(2, artist1.paintings.length);

        // assert new items added 
        assertTrue(ctx.hasChanges());
        assertEquals(1, ctx.Artist.items.length);
        assertEquals(2, ctx.Painting.items.length);
        assertSame(painting1, ctx.changes.items[0]);
        assertSame(painting2, ctx.changes.items[1]);
        assertEquals(2, ctx.changes.items.length);
        assertSame(artist1, ctx.Artist.items[0]);
        assertSame(painting1, ctx.Painting.items[0]);
        assertSame(painting2, ctx.Painting.items[1]);
        assertEquals(tent.entities.ChangeStates.UNCHANGED, artist1.__changeState__);
        assertEquals(tent.entities.ChangeStates.ADDED, painting1.__changeState__);
        assertEquals(tent.entities.ChangeStates.ADDED, painting2.__changeState__);
        
    },
    
    testRela1N_OnUnlinkRemove: function(){
    
        var artist1 = {
            name: 'Frida Kahlo',
            birthdate: new Date(1907, 7, 6),
            nationality: 'Mexican'
        }
        
        var painting1 = {
            title: 'Autorretrato con Changuito',
            width: 34.5,
            height: 39.5
        }
        
        var painting2 = {
            title: 'Frutos de la Tierra',
            width: 60,
            height: 40.6
        }
        
        var ctx = new tent.entities.Context(true);
        
        ctx.push(new tent.entities.Type('Artist', {
            name: {},
            birthdate: {},
            nationality: {},
            paintings: {
                cardinality: '1N',
                reverse: 'artist',
                collection: 'Painting',
                cascadePush: true,
                cascadeRemove: true,
                onLinkPush: true,
                onUnlinkRemove: true
            }
        }), new tent.entities.Type('Painting', {
            title: {},
            width: {},
            height: {},
            artist: {
                cardinality: 'N1',
                reverse: 'paintings',
                collection: 'Artist',
                cascadePush: true,
                onLinkPush: true
            }
        }));
        
        ctx.Artist.push(artist1);
        
        // no links yet
        
        artist1.paintings.push(painting1, painting2);
        
        ctx.acceptChanges();
        
        // remove paintings
        artist1.paintings.splice(0, 1);
        artist1.paintings.remove(painting2);
        
        // assert link is synced
        assertNull(painting1.artist);
        assertNull(painting2.artist);
        
        // assert children are deleted 
        assertTrue(ctx.hasChanges());
        assertEquals(tent.entities.ChangeStates.UNCHANGED, artist1.__changeState__);
        assertEquals(tent.entities.ChangeStates.DELETED, painting1.__changeState__);
        assertEquals(tent.entities.ChangeStates.DELETED, painting2.__changeState__);
        assertEquals(1, ctx.Artist.items.length);
        assertEquals(0, ctx.Painting.items.length);
        assertSame(painting1, ctx.changes.items[0]);
        assertSame(painting2, ctx.changes.items[1]);
        assertEquals(2, ctx.changes.items.length);
        
    },
    
    testRela1N_CascadePush: function(){
    
        var artist1 = {
            name: 'Frida Kahlo',
            birthdate: new Date(1907, 7, 6),
            nationality: 'Mexican'
        }
        
        var painting1 = {
            title: 'Autorretrato con Changuito',
            width: 34.5,
            height: 39.5
        }
        
        var painting2 = {
            title: 'Frutos de la Tierra',
            width: 60,
            height: 40.6
        }
        
        var ctx = new tent.entities.Context(true);
        
        ctx.push(new tent.entities.Type('Artist', {
            name: {},
            birthdate: {},
            nationality: {},
            paintings: {
                cardinality: '1N',
                reverse: 'artist',
                collection: 'Painting',
                cascadePush: true,
                cascadeRemove: true,
                onLinkPush: true,
                onUnlinkRemove: true
            }
        }), new tent.entities.Type('Painting', {
            title: {},
            width: {},
            height: {},
            artist: {
                cardinality: 'N1',
                reverse: 'paintings',
                collection: 'Artist',
                cascadePush: true,
                onLinkPush: true
            }
        }));
        
        ctx.Artist.type.applyTo(artist1);
        artist1.paintings.push(painting1, painting2);
        
        ctx.push(artist1);
        
        // 3 items added as new
        assertTrue(ctx.hasChanges());
        assertEquals(1, ctx.Artist.items.length);
        assertEquals(2, ctx.Painting.items.length);
        assertSame(painting1, ctx.Painting.items[0]);
        assertSame(painting2, ctx.Painting.items[1]);
        assertEquals(tent.entities.ChangeStates.ADDED, artist1.__changeState__);
        assertEquals(tent.entities.ChangeStates.ADDED, painting1.__changeState__);
        assertEquals(tent.entities.ChangeStates.ADDED, painting2.__changeState__);
        
    },
    
    testRela1N_CascadeRemove: function(){
    
        var artist1 = {
            name: 'Frida Kahlo',
            birthdate: new Date(1907, 7, 6),
            nationality: 'Mexican'
        }
        
        var painting1 = {
            title: 'Autorretrato con Changuito',
            width: 34.5,
            height: 39.5
        }
        
        var painting2 = {
            title: 'Frutos de la Tierra',
            width: 60,
            height: 40.6
        }
        
        var ctx = new tent.entities.Context(true);
        
        ctx.push(new tent.entities.Type('Artist', {
            name: {},
            birthdate: {},
            nationality: {},
            paintings: {
                cardinality: '1N',
                reverse: 'artist',
                collection: 'Painting',
                cascadePush: true,
                cascadeRemove: true,
                onLinkPush: true,
                onUnlinkRemove: true
            }
        }), new tent.entities.Type('Painting', {
            title: {},
            width: {},
            height: {},
            artist: {
                cardinality: 'N1',
                reverse: 'paintings',
                collection: 'Artist',
                cascadePush: true,
                onLinkPush: true
            }
        }));
        
        ctx.Artist.push(artist1);
        
        artist1.paintings.push(painting1, painting2);
        
        ctx.acceptChanges();
        
        ctx.remove(artist1);
        
        // 3 items removed
        assertTrue(ctx.hasChanges());
        assertEquals(0, ctx.Artist.items.length);
        assertEquals(0, ctx.Painting.items.length);
        assertEquals(tent.entities.ChangeStates.DELETED, artist1.__changeState__);
        assertEquals(tent.entities.ChangeStates.DELETED, painting1.__changeState__);
        assertEquals(tent.entities.ChangeStates.DELETED, painting2.__changeState__);
        assertSame(artist1, ctx.changes.items[0]);
        assertSame(painting1, ctx.changes.items[1]);
        assertSame(painting2, ctx.changes.items[2]);
        assertEquals(3, ctx.changes.items.length);
        
    }
    
});
