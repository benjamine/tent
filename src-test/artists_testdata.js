
function getArtistEntityModel(){

    return {
        types: {
            Artist: {
                id: {
                    unique: true
                },
                name_: {
                    unique: true
                },
                birthdate: {},
                birthplace: {},
                works: {
                    collection: 'Work',
                    cardinality: '1N',
                    reverse: 'author',
                    cascadePush: true,
                    cascadeRemove: true,
                    onLinkPush: true,
                    onUnlinkRemove: true
                },
                bio: {
                    collection: 'ArtistBio',
                    reverse: 'artist',
                    cascadePush: true,
                    cascadeRemove: true,
                    onLinkPush: true,
                    onUnlinkRemove: true
                }
            },
            ArtistBio: {
                id: {
                    unique: true
                },
                artist: {
                    collection: 'Artist',
                    reverse: 'bio',
                    cascadePush: true,
                    onLinkPush: true
                },
                title: {},
                body: {},
                author: {},
                source: {}
            },
            WorkType: {
                id: {
                    unique: true
                },
                name_: {
                    unique: true
                },
                works: {
                    collection: 'Work',
                    cardinality: '1N',
                    reverse: 'type',
                    cascadePush: true,
                    onLinkPush: true
                }
            },
            WorkTag: {
                name_: {
                    unique: true
                },
                works: {
                    collection: 'Work',
                    cardinality: 'NM',
                    reverse: 'tags',
                    cascadePush: true,
                    onLinkPush: true
                }
            },
            WorkTechnique: {
                id: {
                    unique: true
                },
                name_: {
                    unique: true
                },
                works: {
                    collection: 'Work',
                    cardinality: '1N',
                    reverse: 'technique',
                    cascadePush: true,
                    onLinkPush: true
                }
            },
            Work: {
                id: {
                    unique: true
                },
                code: {},
                name_: {},
                author: {
                    collection: 'Artist',
                    cardinality: 'N1',
                    reverse: 'works',
                    cascadePush: true,
                    onLinkPush: true
                },
                type: {
                    collection: 'WorkType',
                    cardinality: 'N1',
                    reverse: 'works',
                    cascadePush: true,
                    onLinkPush: true
                },
                technique: {
                    collection: 'WorkTechnique',
                    cardinality: 'N1',
                    reverse: 'works',
                    cascadePush: true,
                    onLinkPush: true
                },
                tags: {
                    collection: 'WorkTag',
                    cardinality: 'NM',
                    reverse: 'works',
                    cascadePush: true,
                    onLinkPush: true
                },
                creationDate: {},
                width: {},
                height: {},
                length: {},
                weight: {}
            }
        }
    };
}

function getArtistData(){

    var data = {
        Artist: [],
        Work: [],
        WorkType: [],
        WorkTechnique: [],
        WorkTag: []
    };
    
    data.Artist.push({
        name_: 'Frida Kahlo',
        birthdate: new Date(1907, 7, 6),
        birthplace: 'Mexico',
        bio: {
            title: 'Frida Kahlo Biography',
            body: 'Frida Kahlo is one of Mexico\'s most famous artists and also something of a feminist icon, celebrated for her passionate indomitability in the face of life\'s trials. She\'s best known for her daring self-portraits depicting the suffering she experienced in her personal life. As a child Kahlo had polio; at the age of 18 she broke her right leg and pelvis in a horrific bus accident, leading to a lifetime of chronic pain. Partially immobile after the accident, Kahlo began painting in the late 1920s. She married famed muralist Diego Rivera in 1929 and together they travelled to the United States, staying in Detroit and New York City in the early 1930s. In the late 1930s Kahlo had exhibitions of her paintings in New York City and Paris and associated with some of the most famous painters in the world. Kahlo and Rivera were both known for their extramarital affairs (Kahlo supposedly was a lover of Leon Trotsky) and in 1940 they divorced for a short time before remarrying. During the \'40s Kahlo gained international recognition for her colorful and sometimes gruesome paintings (as well as for her bold public persona), but she continued to have health problems. She died in 1954 just after her 47th birthday.',
            source: 'http://www.who2.com/fridakahlo.html'
        }
    });
    
    data.Artist.push({
        name_: 'Benito Quinquela Martin',
        birthdate: new Date(1890, 3, 1),
        birthplace: 'Argentina',
        bio: {
            title: 'Benito Quinquela Martin',
            body: 'Argentine painter born in La Boca, Buenos Aires. Quinquela Martin is considered the port painter-par-excellence and one of the most popular Argentine painters. His paintings of port scenes show the activity, vigor and roughness of the daily life in portuary La Boca.' +
            '\nHis birthday could not be determined precisely as he was abandoned on March 21, 1890 at an orphanage with a note that stated "This kid has been baptized, and his name_ is Benito Juan Martin". From his physical appearance, the nuns who found him deduced that he should be around ten days old; thus March 10 is regarded as his birthday.' +
            '\nBy the 1920s Marcelo T. de Alvear and his wife were very fond of Quinquela Martin\'s works, and this admiration led to a lasting friendship. In 1922, Quinquela Martin was assigned as chancellor of the Argentine Madrid Consulate in Spain. On April, 1923 he exhibited at the Circulo de Bellas Artes of Madrid. Two of his works were acquired by the institution (Buque en reparacion and Efecto de Sol), while another two were acquired by the Museum of Modern Art of Madrid.',
            source: 'http://www.mundoandino.com/argentina/benito-quinquela-martin'
        }
    });
    
    data.Artist.push({
        name_: 'Lola Mora',
        birthdate: new Date(1866, 11, 17),
        birthplace: 'Argentina',
        works: [{
            name_: 'Fuente de las Nereidas',
            creationDate: new Date(1903, 5, 21),
            width: 13,
            height: 6,
            length: 13,
            weight: 12000
        }]
    });
    
    data.Artist.push({
        name_: 'Francisco de Goya y Lucientes',
        birthdate: new Date(1746, 3, 30),
        birthplace: 'Spain'
    });
    
    data.WorkTag.push({
        name_: 'Greek Mithology'
    }, {
        name_: 'Fountain'
    }, {
        name_: 'Destroyed'
    }, {
        name_: 'Lost'
    });
    
    data.WorkType.push({
        name_: 'Sculpture'
    }, {
        name_: 'Painting'
    }, {
        name_: 'Drawing'
    }, {
        name_: 'Photo'
    }, {
        name_: 'Music'
    }, {
        name_: 'Movie'
    }, {
        name_: 'Book'
    });
    
    data.Work.push({
        name_: 'Buques iluminados',
        width: .8,
        height: .9,
        creationDate: new Date(1963, 1, 1)
    });
    
    data.Work.push({
        name_: 'Barcas en el Riachuelo',
        width: .4,
        height: .285,
        creationDate: new Date(1916, 1, 1)
    })
    
    data.Work.push({
        name_: 'Sol de la mañana',
        width: 1,
        height: .9,
        creationDate: new Date(1954, 5, 12)
    })
    
        
    // clone all objects as DOM objects, for browsers that only support tracking DOM objects
    data = tent.domClone(data, {
        deep: true,
        onlyForTracking: true
    
    });
    
    return data;
    
}

