import { u128, VMContext } from 'near-sdk-as'

// explicitly import functions required by spec
import {
  grant_access,
  revoke_access,
  transfer,
  transfer_from,
  check_access,
  get_token_owner,
} from '../main'

// wrap all other functions in `nonSpec` variable, to make it clear when
// tests are using functionality that isn't defined by the spec
import * as nonSpec from '../main'

const alice = 'alice'
const bob = 'bob'
const carol = 'carol'

describe('grant_access', () => {
  it('grants access to the given account_id for all the tokens that account has', () => {
    // Alice has a token
    const aliceToken = nonSpec.mint_to(alice)

    // Alice calls `grant_access` to make Bob her escrow
    VMContext.setPredecessor_account_id(alice)
    grant_access(bob)

    // Bob checks if Alice has done so
    VMContext.setPredecessor_account_id(bob)
    expect(check_access(alice)).toBe(true)
  })
})

describe('revoke_access', () => {
  it('revokes access to the given `accountId` for the given `tokenId`', () => {
    // Prevent error `InconsistentStateError(IntegerOverflow)` thrown by near-sdk-rs
    VMContext.setStorage_usage(100)

    // Alice has a token
    const aliceToken = nonSpec.mint_to(alice)

    // Alice makes Bob her escrow
    VMContext.setPredecessor_account_id(alice)
    grant_access(bob)

    // Bob checks if he has access to Alice's account
    VMContext.setPredecessor_account_id(bob)
    expect(check_access(alice)).toBe(true)

    // Alice revokes Bob's access
    VMContext.setPredecessor_account_id(alice)
    revoke_access(bob)

    // Bob checks again
    VMContext.setPredecessor_account_id(bob)
    expect(check_access(alice)).toBe(false)
  })
})

describe('transfer_from', () => {
  it('allows owner to transfer given `token_id` to given `owner_id`', () => {
    // Alice has a token
    const aliceToken = nonSpec.mint_to(alice)
    expect(get_token_owner(aliceToken)).toBe(alice)
    expect(get_token_owner(aliceToken)).not.toBe(bob)

    // Alice transfers her token to Bob
    VMContext.setPredecessor_account_id(alice)
    transfer_from(alice, bob, aliceToken)

    // it works!
    expect(get_token_owner(aliceToken)).toBe(bob)
    expect(get_token_owner(aliceToken)).not.toBe(alice)
  })

  it('allows escrow to transfer given `token_id` to given `new_owner_id` if `owner_id` matches', () => {
    // Alice grants access to Bob
    VMContext.setPredecessor_account_id(alice)
    grant_access(bob)

    // Alice has a token
    const aliceToken = nonSpec.mint_to(alice)
    expect(get_token_owner(aliceToken)).toBe(alice)
    expect(get_token_owner(aliceToken)).not.toBe(bob)

    // Bob transfers to himself
    VMContext.setPredecessor_account_id(bob)
    transfer_from(alice, bob, aliceToken)

    // it works!
    expect(get_token_owner(aliceToken)).toBe(bob)
    expect(get_token_owner(aliceToken)).not.toBe(alice)
  })

  it('prevents escrow from transferring given `token_id` to given `new_owner_id if `owner_id` does not match`', () => {
    expect(() => {
      // Alice grants access to Bob
      VMContext.setPredecessor_account_id(alice)
      grant_access(bob)

      // Alice has a token
      const aliceToken = nonSpec.mint_to(alice)
      expect(get_token_owner(aliceToken)).toBe(alice)
      expect(get_token_owner(aliceToken)).not.toBe(bob)

      // Bob attempts to transfer and has access, but owner_id is wrong
      VMContext.setPredecessor_account_id(bob)
      transfer_from(bob, carol, aliceToken)
    }).toThrow(nonSpec.ERROR_OWNER_ID_DOES_NOT_MATCH_EXPECTATION)
  })

  it('prevents anyone else from transferring the token', () => {
    expect(() => {
      // Alice has a token
      const aliceToken = nonSpec.mint_to(alice)

      // Bob tries to transfer it to himself
      VMContext.setPredecessor_account_id(bob)
      transfer_from(alice, bob, aliceToken)
    }).toThrow(nonSpec.ERROR_CALLER_ID_DOES_NOT_MATCH_EXPECTATION)
  })
})

describe('transfer', () => {
  it('allows owner to transfer given `token_id` to given `owner_id`', () => {
    // Alice has a token
    const aliceToken = nonSpec.mint_to(alice)
    expect(get_token_owner(aliceToken)).toBe(alice)
    expect(get_token_owner(aliceToken)).not.toBe(bob)

    // Alice transfers her token to Bob
    VMContext.setPredecessor_account_id(alice)
    transfer(bob, aliceToken)

    // it works!
    expect(get_token_owner(aliceToken)).toBe(bob)
    expect(get_token_owner(aliceToken)).not.toBe(alice)
  })

  it('prevents escrow from using transfer. Escrow can only use transfer_from', () => {
    expect(() => {
      // Alice grants access to Bob
      VMContext.setPredecessor_account_id(alice)
      grant_access(bob)

      // Alice has a token
      const aliceToken = nonSpec.mint_to(alice)
      expect(get_token_owner(aliceToken)).toBe(alice)
      expect(get_token_owner(aliceToken)).not.toBe(bob)

      // Bob attempts to transfer and has access, but owner_id is wrong
      VMContext.setPredecessor_account_id(bob)
      transfer(carol, aliceToken)
    }).toThrow(nonSpec.ERROR_TOKEN_NOT_OWNED_BY_CALLER)
  })

  it('prevents anyone else from transferring the token', () => {
    expect(() => {
      // Alice grants access to Bob
      VMContext.setPredecessor_account_id(alice)

      // Alice has a token
      const aliceToken = nonSpec.mint_to(alice)
      expect(get_token_owner(aliceToken)).toBe(alice)
      expect(get_token_owner(aliceToken)).not.toBe(bob)

      // Bob attempts to transfer and has access, but owner_id is wrong
      VMContext.setPredecessor_account_id(bob)
      transfer(carol, aliceToken)
    }).toThrow(nonSpec.ERROR_TOKEN_NOT_OWNED_BY_CALLER)
  })
})


describe('check_access', () => {
  it('returns true if caller of the function has access to the token', () => {
    // Alice has a token
    const aliceToken = nonSpec.mint_to(alice)

    // Alice grants access to Bob
    VMContext.setPredecessor_account_id(alice)
    grant_access(bob)

    // Bob checks if he has access
    VMContext.setPredecessor_account_id(bob)
    expect(check_access(alice)).toBe(true)
  })

  it('returns false if caller of function does not have access', () => {
    // Alice has a token
    const aliceToken = nonSpec.mint_to(alice)

    // Bob checks if he has access
    VMContext.setPredecessor_account_id(alice)
    expect(check_access(bob)).toBe(false)
  })
})

describe('get_token_owner', () => {
  it('returns accountId of owner of given `tokenId`', () => {
    // Alice and Bob both have tokens
    const aliceToken = nonSpec.mint_to(alice)
    const bobToken = nonSpec.mint_to(bob)

    // Alice owns her own token
    expect(get_token_owner(aliceToken)).toBe(alice)
    expect(get_token_owner(aliceToken)).not.toBe(bob)

    // Bob owns his own token
    expect(get_token_owner(bobToken)).toBe(bob)
    expect(get_token_owner(bobToken)).not.toBe(alice)
  })
})

describe('nonSpec interface', () => {
  it('should throw if we attempt to mint more than the MAX_SUPPLY', () => {
    // we can mint up to MAX_SUPPLY tokens
    expect(() => {
      let limit = nonSpec.MAX_SUPPLY
      while (limit-- > 0) {
        nonSpec.mint_to(alice)
      }
    }).not.toThrow()

    // minting one more than the max throws an error
    expect(() => {
      nonSpec.mint_to(alice)
    }).toThrow(nonSpec.ERROR_MAXIMUM_TOKEN_LIMIT_REACHED)
  })
})

describe('add_to_market', () => {

it('should add nft to market and return true', () => {
  VMContext.setPredecessor_account_id(alice)
  const tokenId = nonSpec.mint_to(alice)
  const price = u128.from('1000000000000000000000000')
  expect(nonSpec.add_to_market(tokenId, price)).toBe(true)
})

  it('should throw if we attempt to add a token that is not owned by the caller', () => {
    expect(() => {
      VMContext.setPredecessor_account_id(bob)
      const tokenId = nonSpec.mint_to(alice)
      const price = u128.from('1000000000000000000000000')
      nonSpec.add_to_market(tokenId, price)
    }).toThrow(nonSpec.ERROR_TOKEN_NOT_OWNED_BY_CALLER) // bob does not own the token he is trying to add to the market so he cannot add it           
    })  // bob does not own the token he is trying to add to the market so he cannot add it           
  })

  describe('get_market_price', () => {
    it('return market price for a token', () => {
        VMContext.setPredecessor_account_id(alice)
        // mint new token that return its id
        const tokenId = nonSpec.mint_to(alice)
        // set price to be 1 NEAR
        const price = u128.from('1000000000000000000000000')
        nonSpec.add_to_market(tokenId, price)
        // get the market price of tokenId
        expect(nonSpec.get_market_price(tokenId)).toBe(price)
    })
})      

describe('remove_from_market', () => {

  it('should remove nft from market and return true', () => { 
    VMContext.setPredecessor_account_id(alice)  // set alice as the caller  of the function to remove the token from the market           
    const tokenId = nonSpec.mint_to(alice)  // mint new token that return its id  
    const price = u128.from('1000000000000000000000000')  // set price to be 1 NEAR
    nonSpec.add_to_market(tokenId, price)  // add token to the market     
    expect(nonSpec.remove_from_market(tokenId)).toBe(true)  // remove token from the market
  }   // remove token from the market
  )

  it('should throw if we attempt to remove a token that is not owned by the caller', () => {
    expect(() => {
      VMContext.setPredecessor_account_id(bob)
      const tokenId = nonSpec.mint_to(alice)
      const price = u128.from('1000000000000000000000000')
      nonSpec.add_to_market(tokenId, price)
      nonSpec.remove_from_market(tokenId) // bob does not own the token he is trying to remove from the market so he cannot remove it
    }).toThrow(nonSpec.ERROR_TOKEN_NOT_OWNED_BY_CALLER) // bob does not own the token he is trying to remove from the market so he cannot remove it
  }
  )
})