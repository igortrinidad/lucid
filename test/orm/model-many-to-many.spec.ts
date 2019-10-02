/*
* @adonisjs/lucid
*
* (c) Harminder Virk <virk@adonisjs.com>
*
* For the full copyright and license information, please view the LICENSE
* file that was distributed with this source code.
*/

/// <reference path="../../adonis-typings/index.ts" />

import test from 'japa'
import { manyToMany, column } from '../../src/Orm/Decorators'
import { ormAdapter, getBaseModel, setup, cleanup, resetTables, getDb } from '../../test-helpers'

let db: ReturnType<typeof getDb>
let BaseModel: ReturnType<typeof getBaseModel>

test.group('Model | Many To Many', (group) => {
  group.before(async () => {
    db = getDb()
    BaseModel = getBaseModel(ormAdapter(db))
    await setup()
  })

  group.after(async () => {
    await cleanup()
    await db.manager.closeAll()
  })

  group.afterEach(async () => {
    await resetTables()
  })

  test('raise error when localKey is missing', (assert) => {
    assert.plan(1)

    try {
      class Skill extends BaseModel {
      }

      class User extends BaseModel {
        @manyToMany(() => Skill)
        public skills: Skill[]
      }

      User.$boot()
      User.$getRelation('skills')!.boot()
    } catch ({ message }) {
      assert.equal(
        message,
        'E_MISSING_RELATED_LOCAL_KEY: User.id required by User.skills relation is missing',
      )
    }
  })

  test('raise error when foreignKey is missing', (assert) => {
    assert.plan(1)

    try {
      class Skill extends BaseModel {
      }
      Skill.$boot()

      class User extends BaseModel {
        @column({ primary: true })
        public id: number

        @manyToMany(() => Skill)
        public skills: Skill[]
      }

      User.$boot()
      User.$getRelation('skills')!.boot()
    } catch ({ message }) {
      assert.equal(
        message,
        'E_MISSING_RELATED_FOREIGN_KEY: Skill.id required by User.skills relation is missing',
      )
    }
  })

  test('use primary key as the local key', (assert) => {
    class Skill extends BaseModel {
      @column({ primary: true })
      public id: number
    }

    class User extends BaseModel {
      @column({ primary: true })
      public id: number

      @manyToMany(() => Skill)
      public skills: Skill[]
    }

    User.$getRelation('skills')!.boot()

    assert.equal(User.$getRelation('skills')!['localKey'], 'id')
    assert.equal(User.$getRelation('skills')!['localAdapterKey'], 'id')
  })

  test('use custom defined primary key', (assert) => {
    class Skill extends BaseModel {
      @column({ primary: true })
      public id: number
    }

    class User extends BaseModel {
      @column({ primary: true })
      public id: number

      @column()
      public uid: number

      @manyToMany(() => Skill, { localKey: 'uid' })
      public skills: Skill[]
    }

    User.$boot()
    User.$getRelation('skills')!.boot()

    assert.equal(User.$getRelation('skills')!['localKey'], 'uid')
    assert.equal(User.$getRelation('skills')!['localAdapterKey'], 'uid')
  })

  test('compute pivotForeignKey from table name + primary key', (assert) => {
    class Skill extends BaseModel {
      @column({ primary: true })
      public id: number
    }

    class User extends BaseModel {
      @column({ primary: true })
      public id: number

      @manyToMany(() => Skill)
      public skills: Skill[]
    }

    User.$getRelation('skills')!.boot()

    assert.equal(User.$getRelation('skills')!['pivotForeignKey'], 'user_id')
    assert.equal(User.$getRelation('skills')!['pivotForeignKeyAlias'], 'pivot_user_id')
  })

  test('use custom defined pivotForeignKey', (assert) => {
    class Skill extends BaseModel {
      @column({ primary: true })
      public id: number
    }

    class User extends BaseModel {
      @column({ primary: true })
      public id: number

      @manyToMany(() => Skill, { pivotForeignKey: 'user_uid' })
      public skills: Skill[]
    }

    User.$getRelation('skills')!.boot()

    assert.equal(User.$getRelation('skills')!['pivotForeignKey'], 'user_uid')
    assert.equal(User.$getRelation('skills')!['pivotForeignKeyAlias'], 'pivot_user_uid')
  })

  test('use primary key of the related model as relatedKey', (assert) => {
    class Skill extends BaseModel {
      @column({ primary: true })
      public id: number
    }

    class User extends BaseModel {
      @column({ primary: true })
      public id: number

      @manyToMany(() => Skill)
      public skills: Skill[]
    }

    User.$boot()
    User.$getRelation('skills')!.boot()

    assert.equal(User.$getRelation('skills')!['relatedKey'], 'id')
    assert.equal(User.$getRelation('skills')!['relatedAdapterKey'], 'id')
  })

  test('use custom defined related key', (assert) => {
    class Skill extends BaseModel {
      @column({ primary: true })
      public id: number

      @column()
      public uid: number
    }

    class User extends BaseModel {
      @column({ primary: true })
      public id: number

      @manyToMany(() => Skill, { relatedKey: 'uid' })
      public skills: Skill[]
    }

    User.$boot()
    User.$getRelation('skills')!.boot()

    assert.equal(User.$getRelation('skills')!['relatedKey'], 'uid')
    assert.equal(User.$getRelation('skills')!['relatedAdapterKey'], 'uid')
  })

  test('compute relatedPivotForeignKey from related model name + primary key', (assert) => {
    class Skill extends BaseModel {
      @column({ primary: true })
      public id: number
    }

    class User extends BaseModel {
      @column({ primary: true })
      public id: number

      @manyToMany(() => Skill)
      public skills: Skill[]
    }

    User.$boot()
    User.$getRelation('skills')!.boot()

    assert.equal(User.$getRelation('skills')!['pivotRelatedForeignKey'], 'skill_id')
    assert.equal(User.$getRelation('skills')!['pivotRelatedForeignKeyAlias'], 'pivot_skill_id')
  })

  test('use predefined relatedPivotForeignKey', (assert) => {
    class Skill extends BaseModel {
      @column({ primary: true })
      public id: number
    }

    class User extends BaseModel {
      @column({ primary: true })
      public id: number

      @manyToMany(() => Skill, { pivotRelatedForeignKey: 'skill_uid' })
      public skills: Skill[]
    }

    User.$boot()
    User.$getRelation('skills')!.boot()

    assert.equal(User.$getRelation('skills')!['pivotRelatedForeignKey'], 'skill_uid')
    assert.equal(User.$getRelation('skills')!['pivotRelatedForeignKeyAlias'], 'pivot_skill_uid')
  })

  test('get eager query', (assert) => {
    class Skill extends BaseModel {
      @column({ primary: true })
      public id: number
    }

    class User extends BaseModel {
      @column({ primary: true })
      public id: number

      @manyToMany(() => Skill)
      public skills: Skill[]
    }

    User.$boot()
    User.$getRelation('skills')!.boot()

    const user = new User()
    user.id = 1

    const { sql, bindings } = User.$getRelation('skills')!.getEagerQuery([user], User.query().client).toSQL()
    const { sql: knexSql, bindings: knexBindings } = db.query()
      .from('skills')
      .select([
        'skills.*',
        'skill_user.user_id as pivot_user_id',
        'skill_user.skill_id as pivot_skill_id',
      ])
      .innerJoin('skill_user', 'skills.id', 'skill_user.skill_id')
      .whereIn('skill_user.user_id', [1])
      .toSQL()

    assert.equal(sql, knexSql)
    assert.deepEqual(bindings, knexBindings)
  })

  test('get query for single parent', (assert) => {
    class Skill extends BaseModel {
      @column({ primary: true })
      public id: number
    }

    class User extends BaseModel {
      @column({ primary: true })
      public id: number

      @manyToMany(() => Skill)
      public skills: Skill[]
    }

    User.$boot()
    User.$getRelation('skills')!.boot()

    const user = new User()
    user.id = 1

    const { sql, bindings } = User.$getRelation('skills')!.getQuery(user, User.query().client).toSQL()
    const { sql: knexSql, bindings: knexBindings } = db.query()
      .from('skills')
      .select([
        'skills.*',
        'skill_user.user_id as pivot_user_id',
        'skill_user.skill_id as pivot_skill_id',
      ])
      .innerJoin('skill_user', 'skills.id', 'skill_user.skill_id')
      .where('skill_user.user_id', 1)
      .toSQL()

    assert.equal(sql, knexSql)
    assert.deepEqual(bindings, knexBindings)
  })

  test('preload relation', async (assert) => {
    class Skill extends BaseModel {
      @column({ primary: true })
      public id: number

      @column()
      public name: string
    }

    class User extends BaseModel {
      @column({ primary: true })
      public id: number

      @manyToMany(() => Skill)
      public skills: Skill[]
    }

    User.$boot()
    User.$getRelation('skills')!.boot()

    await db.insertQuery().table('users').insert([{ username: 'virk' }])
    await db.insertQuery().table('skills').insert([{ name: 'Programming' }, { name: 'Dancing' }])
    await db.insertQuery().table('skill_user').insert([
      {
        user_id: 1,
        skill_id: 1,
      },
    ])

    const users = await User.query().preload('skills')
    assert.lengthOf(users, 1)
    assert.lengthOf(users[0].skills, 1)
    assert.equal(users[0].skills[0].name, 'Programming')
    assert.equal(users[0].skills[0].$extras.pivot_user_id, 1)
    assert.equal(users[0].skills[0].$extras.pivot_skill_id, 1)
  })

  test('preload relation for many', async (assert) => {
    class Skill extends BaseModel {
      @column({ primary: true })
      public id: number

      @column()
      public name: string
    }

    class User extends BaseModel {
      @column({ primary: true })
      public id: number

      @manyToMany(() => Skill)
      public skills: Skill[]
    }

    User.$boot()
    User.$getRelation('skills')!.boot()

    await db.insertQuery().table('users').insert([{ username: 'virk' }, { username: 'nikk' }])
    await db.insertQuery().table('skills').insert([{ name: 'Programming' }, { name: 'Dancing' }])
    await db.insertQuery().table('skill_user').insert([
      {
        user_id: 1,
        skill_id: 1,
      },
      {
        user_id: 1,
        skill_id: 2,
      },
      {
        user_id: 2,
        skill_id: 2,
      },
    ])

    const users = await User.query().preload('skills')
    assert.lengthOf(users, 2)
    assert.lengthOf(users[0].skills, 2)
    assert.lengthOf(users[1].skills, 1)

    assert.equal(users[0].skills[0].name, 'Programming')
    assert.equal(users[0].skills[0].$extras.pivot_user_id, 1)
    assert.equal(users[0].skills[0].$extras.pivot_skill_id, 1)

    assert.equal(users[0].skills[1].name, 'Dancing')
    assert.equal(users[0].skills[1].$extras.pivot_user_id, 1)
    assert.equal(users[0].skills[1].$extras.pivot_skill_id, 2)

    assert.equal(users[1].skills[0].name, 'Dancing')
    assert.equal(users[1].skills[0].$extras.pivot_user_id, 2)
    assert.equal(users[1].skills[0].$extras.pivot_skill_id, 2)
  })

  test('raise error when local key is not selected', async (assert) => {
    assert.plan(1)

    class Skill extends BaseModel {
      @column({ primary: true })
      public id: number

      @column()
      public name: string
    }

    class User extends BaseModel {
      @column({ primary: true })
      public id: number

      @manyToMany(() => Skill)
      public skills: Skill[]
    }

    User.$boot()
    User.$getRelation('skills')!.boot()

    await db.insertQuery().table('users').insert([{ username: 'virk' }, { username: 'nikk' }])
    await db.insertQuery().table('skills').insert([{ name: 'Programming' }, { name: 'Dancing' }])
    await db.insertQuery().table('skill_user').insert([
      {
        user_id: 1,
        skill_id: 1,
      },
      {
        user_id: 1,
        skill_id: 2,
      },
      {
        user_id: 2,
        skill_id: 2,
      },
    ])

    try {
      await User.query().select('username').preload('skills')
    } catch ({ message }) {
      assert.equal(message, 'Cannot preload skills, value of User.id is undefined')
    }
  })

  test('select extra pivot columns', async (assert) => {
    class Skill extends BaseModel {
      @column({ primary: true })
      public id: number

      @column()
      public name: string

      @column()
      public proficiency: string
    }

    class User extends BaseModel {
      @column({ primary: true })
      public id: number

      @manyToMany(() => Skill, { pivotColumns: ['proficiency'] })
      public skills: Skill[]
    }

    User.$boot()
    User.$getRelation('skills')!.boot()

    await db.insertQuery().table('users').insert([{ username: 'virk' }, { username: 'nikk' }])
    await db.insertQuery().table('skills').insert([{ name: 'Programming' }, { name: 'Dancing' }])
    await db.insertQuery().table('skill_user').insert([
      {
        user_id: 1,
        skill_id: 1,
        proficiency: 'expert',
      },
      {
        user_id: 1,
        skill_id: 2,
        proficiency: 'beginner',
      },
      {
        user_id: 2,
        skill_id: 2,
        proficiency: 'beginner',
      },
    ])

    const users = await User.query().preload('skills')
    assert.lengthOf(users, 2)
    assert.lengthOf(users[0].skills, 2)
    assert.lengthOf(users[1].skills, 1)

    assert.equal(users[0].skills[0].name, 'Programming')
    assert.equal(users[0].skills[0].$extras.pivot_user_id, 1)
    assert.equal(users[0].skills[0].$extras.pivot_skill_id, 1)
    assert.equal(users[0].skills[0].$extras.pivot_proficiency, 'expert')

    assert.equal(users[0].skills[1].name, 'Dancing')
    assert.equal(users[0].skills[1].$extras.pivot_user_id, 1)
    assert.equal(users[0].skills[1].$extras.pivot_skill_id, 2)
    assert.equal(users[0].skills[1].$extras.pivot_proficiency, 'beginner')

    assert.equal(users[1].skills[0].name, 'Dancing')
    assert.equal(users[1].skills[0].$extras.pivot_user_id, 2)
    assert.equal(users[1].skills[0].$extras.pivot_skill_id, 2)
    assert.equal(users[1].skills[0].$extras.pivot_proficiency, 'beginner')
  })

  test('select extra pivot columns at runtime', async (assert) => {
    class Skill extends BaseModel {
      @column({ primary: true })
      public id: number

      @column()
      public name: string

      @column()
      public proficiency: string
    }

    class User extends BaseModel {
      @column({ primary: true })
      public id: number

      @manyToMany(() => Skill)
      public skills: Skill[]
    }

    User.$boot()
    User.$getRelation('skills')!.boot()

    await db.insertQuery().table('users').insert([{ username: 'virk' }, { username: 'nikk' }])
    await db.insertQuery().table('skills').insert([{ name: 'Programming' }, { name: 'Dancing' }])
    await db.insertQuery().table('skill_user').insert([
      {
        user_id: 1,
        skill_id: 1,
        proficiency: 'expert',
      },
      {
        user_id: 1,
        skill_id: 2,
        proficiency: 'beginner',
      },
      {
        user_id: 2,
        skill_id: 2,
        proficiency: 'beginner',
      },
    ])

    const users = await User.query().preload<'manyToMany'>('skills', (builder) => {
      builder.pivotColumns(['proficiency'])
    })

    assert.lengthOf(users, 2)
    assert.lengthOf(users[0].skills, 2)
    assert.lengthOf(users[1].skills, 1)

    assert.equal(users[0].skills[0].name, 'Programming')
    assert.equal(users[0].skills[0].$extras.pivot_user_id, 1)
    assert.equal(users[0].skills[0].$extras.pivot_skill_id, 1)
    assert.equal(users[0].skills[0].$extras.pivot_proficiency, 'expert')

    assert.equal(users[0].skills[1].name, 'Dancing')
    assert.equal(users[0].skills[1].$extras.pivot_user_id, 1)
    assert.equal(users[0].skills[1].$extras.pivot_skill_id, 2)
    assert.equal(users[0].skills[1].$extras.pivot_proficiency, 'beginner')

    assert.equal(users[1].skills[0].name, 'Dancing')
    assert.equal(users[1].skills[0].$extras.pivot_user_id, 2)
    assert.equal(users[1].skills[0].$extras.pivot_skill_id, 2)
    assert.equal(users[1].skills[0].$extras.pivot_proficiency, 'beginner')
  })
})