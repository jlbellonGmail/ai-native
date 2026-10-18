type RuntimeTask<T> = {
    agent: string;
    input: unknown;
    execute: () => Promise<T>;
};

type RuntimeContext = {
    feature: string;
};

type ReferenceRuntime = {
    context: RuntimeContext;
    runAgentTask: <T>(task: RuntimeTask<T>) => Promise<T>;
};

export async function withRuntime<T>(
    context: RuntimeContext,
    execute: (runtime: ReferenceRuntime) => Promise<T>
): Promise<T> {
    const runtime: ReferenceRuntime = {
        context,
        runAgentTask: async (task) => task.execute()
    };

    return execute(runtime);
}
