
TestCase("ContextArtistDemoTest", {

    testArtistDemo_PrepareContext: function(){
    
        // create a new Context
        var ctx = new tent.entities.Context();
        
        // load entity model
        ctx.pushModel(getArtistEntityModel());
        
        assertInstanceOf(tent.entities.Collection, ctx.Artist);
        assertInstanceOf(tent.entities.Collection, ctx.ArtistBio);
        assertInstanceOf(tent.entities.Collection, ctx.Work);
        assertInstanceOf(tent.entities.Collection, ctx.WorkTag);
        assertInstanceOf(tent.entities.Collection, ctx.WorkType);
        assertInstanceOf(tent.entities.Collection, ctx.WorkTechnique);
        
        assertInstanceOf(tent.entities.Type, ctx.Artist.type);
        
        assertObject(ctx.Artist.type.properties);
        assertObject(ctx.Artist.type.properties.name_);
        assertObject(ctx.Artist.type.properties.works);
        
    },
    
    testArtistDemo_PushSomeData: function(){
    
        // create a new Context
        var ctx = new tent.entities.Context();
        
        // load entity model
        ctx.pushModel(getArtistEntityModel());
        
        var data = getArtistData();
        
        ctx.WorkType.push(data.WorkType);
        ctx.WorkTag.push(data.WorkTag);
        ctx.Artist.push(data.Artist[0], data.Artist[1]);
        
        assertEquals(data.WorkType.length, ctx.WorkType.items.length);
        assertEquals(data.WorkTag.length, ctx.WorkTag.items.length);
        assertEquals(2, ctx.Artist.items.length);
    },
    
    testArtistDemo_ChangeScalarProperty: function(){
    
        // create a new Context
        var ctx = new tent.entities.Context();
        
        // load entity model
        ctx.pushModel(getArtistEntityModel());
        
        var data = getArtistData();
        
        var artist1 = data.Artist[0];
        
        ctx.WorkType.push(data.WorkType);
        ctx.WorkTag.push(data.WorkTag);
        ctx.Artist.push(data.Artist[0], data.Artist[1]);
        
        ctx.trackChanges();
        
        // change artist name_ 
        artist1.name_ = 'Kahlo, Frida';
        
        // artist change is detected
        assertEquals(tent.entities.ChangeStates.MODIFIED, artist1.__changeState__);
        assertTrue(ctx.hasChanges());
        assertEquals(1, ctx.changes.items.length);
        assertSame(artist1, ctx.changes.items[0]);
    }
});
