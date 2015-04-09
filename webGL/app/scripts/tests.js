/* global QUnit */
/* global TestDataGenerator */
/* global LandscapeDataGenerator */

QUnit.test('TestDataGenerator_next', function( assert ) {
    'use strict';
    var data_generator = new TestDataGenerator(100,100,10);
    assert.ok(data_generator, 'data_generator ok.');

    for(var count = 0; count < 100; count++){   // 100 comes from (10 * 10) where point_density is 10.
        var shape = data_generator.next();
        assert.ok(shape.length > 3, 'shape has > 3 elements.');   // 1 central and at least 3 points.
        assert.ok(shape.length <= 11, 'shape has <= 11 elements.'); // 1 central and at most 10 points.
        for(var point_index in shape){
            assert.strictEqual(shape[point_index].length, 3, 'point has 3 coordinates');
        }
    }

    assert.strictEqual(data_generator.next(), undefined, 'generator exahusted');
});

QUnit.test('TestDataGenerator_reset', function( assert ) {
    'use strict';
    var data_generator = new TestDataGenerator(100,100,2);
    assert.ok(data_generator, 'data_generator ok.');
    for(var count = 0; count < 4; count++){     // 4 = (point_density * point_density) where point_density is 2.
        assert.ok(data_generator.next(), 'data returned');
    }
    assert.strictEqual(data_generator.next(), undefined, 'generator exahusted');
    assert.strictEqual(data_generator.next(), undefined, 'generator exahusted');

    data_generator.reset();

    assert.ok(data_generator.next(), 'data returned');
});

QUnit.test('LandscapeDataGenerator_next', function( assert ) {
    'use strict';
    var data_generator = new LandscapeDataGenerator(1);
    assert.ok(data_generator, 'data_generator ok.');

    var shape = data_generator.next();
    while(shape){
        assert.ok(shape.length > 3, 'shape has > 3 elements.');   // 1 central and at least 3 points.
        for(var point_index in shape){
            assert.strictEqual(shape[point_index].length, 3, 'point has 3 coordinates');
        }
        shape = data_generator.next();
    }
    assert.strictEqual(shape, undefined, 'generator exahusted');
});

QUnit.test('LandscapeDataGenerator_reset', function( assert ) {
    'use strict';
    var data_generator = new LandscapeDataGenerator(1);
    assert.ok( data_generator, 'data_generator ok.');

    var count = 0;
    var shape = data_generator.next();
    while(shape){
        shape = data_generator.next();
        count++;
    }
    assert.strictEqual(shape, undefined, 'generator exahusted');
    assert.strictEqual(shape, undefined, 'generator exahusted');

    data_generator.reset();
    var count_2 = 0;
    shape = data_generator.next();
    while(shape){
        shape = data_generator.next();
        count_2++;
    }

    assert.strictEqual(count, count_2, 'both passes of generator are same length');
});

