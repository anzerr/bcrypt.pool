
declare class BcryptPool {

	constructor(size: number, hashRound: number);
	hash(str: string): Promise<string>
	compare(str: string, hash: string): Promise<boolean>
	close(): void

}

export default BcryptPool