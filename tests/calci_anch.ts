import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { CalciAnch } from "../target/types/calci_anch";
import { SystemProgram, PublicKey } from "@solana/web3.js";
import { assert } from "chai";

describe("calci_anch with PDA", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.CalciAnch as Program<CalciAnch>;

  // We’ll derive the PDA once and reuse it
  let calciPda: PublicKey;
  let bump: number;

  before(async () => {
    [calciPda, bump] = PublicKey.findProgramAddressSync(
      [Buffer.from("calci"), provider.wallet.publicKey.toBuffer()],
      program.programId
    );
  });

  it("Initialize PDA account", async () => {
    const tx = await program.methods
      .initialize()
      .accounts({
        feePayer: provider.wallet.publicKey,
      })
      .rpc();

    console.log("Init Tx:", tx);

    const account = await program.account.calciResult.fetch(calciPda);
    assert.equal(account.calciResult, 0);
    assert.equal(
      account.payer.toBase58(),
      provider.wallet.publicKey.toBase58()
    );
  });

  it("Performs addition", async () => {
    await program.methods
      .add(10, 20)
      .accounts({
        cacliAcc: calciPda,
      })
      .rpc();

    const account = await program.account.calciResult.fetch(calciPda);
    assert.equal(account.calciResult, 30);
  });

  it("Performs subtraction", async () => {
    await program.methods
      .sub(50, 15)
      .accounts({
        cacliAcc: calciPda,
      })
      .rpc();

    const account = await program.account.calciResult.fetch(calciPda);
    assert.equal(account.calciResult, 35);
  });

  it("Performs division", async () => {
    await program.methods
      .div(100, 5)
      .accounts({
        cacliAcc: calciPda,
      })
      .rpc();

    const account = await program.account.calciResult.fetch(calciPda);
    assert.equal(account.calciResult, 20);
  });

  it("Fails division by zero", async () => {
    try {
      await program.methods
        .div(10, 0)
        .accounts({
          cacliAcc: calciPda,
        })
        .rpc();

      assert.fail("Expected division by zero to throw");
    } catch (err: any) {
      // Anchor error surface
      const errMsg = err.error.errorMessage;
      assert.equal(errMsg, "Division by zero is not allowed");
    }
  });
});
