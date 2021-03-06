export class DeleteThrowErrorController {
    async handle(handle: Promise<unknown>, msgError: string) {
        try {
            await handle;

            return {
                success: true
            }
        } catch (error) {
            console.log(error)
            return { success: false, message: msgError, error };
        }
    }
}