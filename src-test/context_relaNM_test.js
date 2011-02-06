
TestCase("ContextRelaNMTest", {

    testRelaNM_OnLinkPush: function() {

        var artist1 = {
            name: 'Frida Kahlo',
            birthdate: new Date(1907, 7, 6),
            nationality: 'Mexican'
        }

        var artist2 = {
            name: 'André Breton',
            birthdate: new Date(1896, 2, 19),
            nationality: 'French'
        }

        var artist3 = {
            name: 'Marcel Duchamp',
            birthdate: new Date(1887, 7, 28),
            nationality: 'French'
        }

        var ctx = new tent.entities.Context(true);

        ctx.push(
            new tent.entities.Type('Artist', {
                name: {},
                birthdate: {},
                nationality: {},
                friends: {
                    cardinality: 'NM',
                    reverse: 'friends',
                    collection: 'Artist',
                    trackLinks: true,
                    cascadePush: true,
                    onLinkPush: true
                }
            })
        );

        ctx.Artist.push(artist1);

        // no links yet
        assertArray(artist1.friends);
        assertEquals(0, artist1.friends.length);
        assertUndefined(artist2.friends);

        ctx.acceptChanges();

        // add relations
        artist1.friends.push(artist2);
        artist2.friends.push(artist3);
        artist3.friends.push(artist1);

        // assert link is synced
        assertSame(artist2, artist1.friends[0]);
        assertSame(artist1, artist2.friends[0]);
        assertSame(artist3, artist2.friends[1]);
        assertSame(artist2, artist3.friends[0]);
        assertSame(artist1, artist3.friends[1]);
        assertSame(artist3, artist1.friends[1]);
        assertSame(2, artist1.friends.length);
        assertSame(2, artist2.friends.length);
        assertSame(2, artist3.friends.length);

        // assert new item added 
        assertTrue(ctx.hasChanges());
        assertEquals(3, ctx.Artist.items.length);
        assertSame(artist2, ctx.changes.items[0]);

        // new links added
        assertInstanceOf(tent.entities.EntityLink, ctx.changes.items[1]);
        assertSame(artist1, ctx.changes.items[1].from);
        assertSame(artist2, ctx.changes.items[1].to);
        assertEquals(tent.entities.ChangeStates.ADDED, ctx.changes.items[1].__changeState__);
        assertInstanceOf(tent.entities.EntityLink, ctx.changes.items[2]);
        assertSame(artist2, ctx.changes.items[2].from);
        assertSame(artist1, ctx.changes.items[2].to);
        assertEquals(tent.entities.ChangeStates.ADDED, ctx.changes.items[2].__changeState__);

        assertSame(artist3, ctx.changes.items[3]);

        // new links added
        assertInstanceOf(tent.entities.EntityLink, ctx.changes.items[4]);
        assertSame(artist2, ctx.changes.items[4].from);
        assertSame(artist3, ctx.changes.items[4].to);
        assertEquals(tent.entities.ChangeStates.ADDED, ctx.changes.items[4].__changeState__);
        assertInstanceOf(tent.entities.EntityLink, ctx.changes.items[5]);
        assertSame(artist3, ctx.changes.items[5].from);
        assertSame(artist2, ctx.changes.items[5].to);
        assertEquals(tent.entities.ChangeStates.ADDED, ctx.changes.items[5].__changeState__);

        // new links added
        assertInstanceOf(tent.entities.EntityLink, ctx.changes.items[6]);
        assertSame(artist3, ctx.changes.items[6].from);
        assertSame(artist1, ctx.changes.items[6].to);
        assertEquals(tent.entities.ChangeStates.ADDED, ctx.changes.items[6].__changeState__);
        assertInstanceOf(tent.entities.EntityLink, ctx.changes.items[7]);
        assertSame(artist1, ctx.changes.items[7].from);
        assertSame(artist3, ctx.changes.items[7].to);
        assertEquals(tent.entities.ChangeStates.ADDED, ctx.changes.items[7].__changeState__);

        assertEquals(8, ctx.changes.items.length);
        assertSame(artist1, ctx.Artist.items[0]);
        assertSame(artist2, ctx.Artist.items[1]);
        assertSame(artist3, ctx.Artist.items[2]);
        assertEquals(tent.entities.ChangeStates.UNCHANGED, artist1.__changeState__);
        assertEquals(tent.entities.ChangeStates.ADDED, artist2.__changeState__);
        assertEquals(tent.entities.ChangeStates.ADDED, artist3.__changeState__);

    },

    testRelaNM_OnUnlinkRemove: function() {

        var artist1 = {
            name: 'Frida Kahlo',
            birthdate: new Date(1907, 7, 6),
            nationality: 'Mexican'
        }

        var artist2 = {
            name: 'André Breton',
            birthdate: new Date(1896, 2, 19),
            nationality: 'French'
        }

        var artist3 = {
            name: 'Marcel Duchamp',
            birthdate: new Date(1887, 7, 28),
            nationality: 'French'
        }

        var ctx = new tent.entities.Context(true);

        ctx.push(
            new tent.entities.Type('Artist', {
                name: {},
                birthdate: {},
                nationality: {},
                friends: {
                    cardinality: 'NM',
                    reverse: 'friends',
                    collection: 'Artist',
                    trackLinks: true,
                    cascadePush: true,
                    onLinkPush: true
                }
            })
        );

        ctx.Artist.push(artist1);
        artist1.friends.push(artist2, artist3);

        ctx.acceptChanges();

        // remove friends
        artist1.friends.splice(0, 1);
        artist1.friends.remove(artist3);

        // assert link is synced
        assertEquals(0, artist1.friends.length);
        assertEquals(0, artist2.friends.length);
        assertEquals(0, artist3.friends.length);

        // assert entities are unchanged 
        assertEquals(tent.entities.ChangeStates.UNCHANGED, artist1.__changeState__);
        assertEquals(tent.entities.ChangeStates.UNCHANGED, artist2.__changeState__);
        assertEquals(tent.entities.ChangeStates.UNCHANGED, artist3.__changeState__);

        // links removed
        assertTrue(ctx.hasChanges());
        assertInstanceOf(tent.entities.EntityLink, ctx.changes.items[0]);
        assertSame(artist1, ctx.changes.items[0].from);
        assertSame(artist2, ctx.changes.items[0].to);
        assertEquals(tent.entities.ChangeStates.DELETED, ctx.changes.items[0].__changeState__);
        assertInstanceOf(tent.entities.EntityLink, ctx.changes.items[1]);
        assertSame(artist2, ctx.changes.items[1].from);
        assertSame(artist1, ctx.changes.items[1].to);
        assertEquals(tent.entities.ChangeStates.DELETED, ctx.changes.items[1].__changeState__);

        // links removed
        assertInstanceOf(tent.entities.EntityLink, ctx.changes.items[2]);
        assertSame(artist1, ctx.changes.items[2].from);
        assertSame(artist3, ctx.changes.items[2].to);
        assertEquals(tent.entities.ChangeStates.DELETED, ctx.changes.items[2].__changeState__);
        assertInstanceOf(tent.entities.EntityLink, ctx.changes.items[3]);
        assertSame(artist3, ctx.changes.items[3].from);
        assertSame(artist1, ctx.changes.items[3].to);
        assertEquals(tent.entities.ChangeStates.DELETED, ctx.changes.items[3].__changeState__);

        assertEquals(4, ctx.changes.items.length);

    },

    testRelaNM_CascadePush: function() {

        var artist1 = {
            name: 'Frida Kahlo',
            birthdate: new Date(1907, 7, 6),
            nationality: 'Mexican'
        }

        var artist2 = {
            name: 'André Breton',
            birthdate: new Date(1896, 2, 19),
            nationality: 'French'
        }

        var artist3 = {
            name: 'Marcel Duchamp',
            birthdate: new Date(1887, 7, 28),
            nationality: 'French'
        }

        var ctx = new tent.entities.Context(true);

        ctx.push(
            new tent.entities.Type('Artist', {
                name: {},
                birthdate: {},
                nationality: {},
                friends: {
                    cardinality: 'NM',
                    reverse: 'friends',
                    collection: 'Artist',
                    trackLinks: true,
                    cascadePush: true,
                    onLinkPush: true
                }
            })
        );

        ctx.Artist.type.applyTo(artist1);
        artist1.friends.push(artist2, artist3);

        ctx.push(artist1);

        // 3 items added as new
        assertTrue(ctx.hasChanges());
        assertEquals(3, ctx.Artist.items.length);
        assertSame(artist2, ctx.Artist.items[1]);
        assertSame(artist3, ctx.Artist.items[2]);

        assertEquals(3, ctx.changes.items.length);

        assertEquals(tent.entities.ChangeStates.ADDED, artist1.__changeState__);
        assertEquals(tent.entities.ChangeStates.ADDED, artist2.__changeState__);
        assertEquals(tent.entities.ChangeStates.ADDED, artist3.__changeState__);

    },

    testRelaNM_CascadeRemove: function() {

        var artist1 = {
            name: 'Frida Kahlo',
            birthdate: new Date(1907, 7, 6),
            nationality: 'Mexican'
        }

        var artist2 = {
            name: 'André Breton',
            birthdate: new Date(1896, 2, 19),
            nationality: 'French'
        }

        var artist3 = {
            name: 'Marcel Duchamp',
            birthdate: new Date(1887, 7, 28),
            nationality: 'French'
        }

        var ctx = new tent.entities.Context(true);

        ctx.push(
            new tent.entities.Type('Artist', {
                name: {},
                birthdate: {},
                nationality: {},
                friends: {
                    cardinality: 'NM',
                    reverse: 'friends',
                    collection: 'Artist',
                    trackLinks: true,
                    cascadePush: true,
                    cascadeRemove: true,
                    onLinkPush: true
                }
            })
        );

        ctx.Artist.push(artist1);

        artist1.friends.push(artist2, artist3);

        ctx.acceptChanges();

        ctx.remove(artist1);

        // 3 items removed
        assertTrue(ctx.hasChanges());
        assertEquals(0, ctx.Artist.items.length);
        assertEquals(tent.entities.ChangeStates.DELETED, artist1.__changeState__);
        assertEquals(tent.entities.ChangeStates.DELETED, artist2.__changeState__);
        assertEquals(tent.entities.ChangeStates.DELETED, artist3.__changeState__);
        assertSame(artist1, ctx.changes.items[0]);
        assertSame(artist2, ctx.changes.items[1]);
        assertSame(artist3, ctx.changes.items[2]);
        assertEquals(3, ctx.changes.items.length);

    }

});