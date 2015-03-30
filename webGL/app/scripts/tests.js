QUnit.test( "hello test", function( assert ) {
      assert.ok( 1 == "1", "Passed!" );
});

QUnit.test( "TestDataGenerator_next", function( assert ) {
    var data_generator = new TestDataGenerator(100,100,10);
    assert.ok( data_generator, "data_generator ok." );

    for(var count = 0; count < 100; count++){   // 100 comes from (10 * 10) where point_density is 10.
        var shape = data_generator.next();
        assert.ok(shape.length > 3, "shape has > 3 elements.");   // 1 central and at least 3 points.
        assert.ok(shape.length <= 11, "shape has <= 11 elements."); // 1 central and at most 10 points.
        for(var point_index in shape){
            assert.strictEqual(shape[point_index].length, 3, "point has 3 coordinates");
        }
    }

    assert.strictEqual(data_generator.next(), undefined, 'generator exahusted');
});

QUnit.test( "TestDataGenerator_reset", function( assert ) {
    var data_generator = new TestDataGenerator(100,100,2);
    assert.ok( data_generator, "data_generator ok." );
    for(var count = 0; count < 4; count++){     // 4 = (point_density * point_density) where point_density is 2.
        assert.ok(data_generator.next(), 'data returned');
    }
    assert.strictEqual(data_generator.next(), undefined, 'generator exahusted');
    assert.strictEqual(data_generator.next(), undefined, 'generator exahusted');

    data_generator.reset();

    assert.ok(data_generator.next(), 'data returned');
});