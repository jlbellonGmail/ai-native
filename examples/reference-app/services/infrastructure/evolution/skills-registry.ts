type Skill = {
    name: string;
    condition: (context: any) => boolean;
    execute: (context: any) => Promise<void>;
};

export class SkillsRegistry {

    private static skills: Skill[] = [];

    static register(skill: Skill) {
        this.skills.push(skill);
    }

    static async run(context: any) {

        for (const skill of this.skills) {

            if (skill.condition(context)) {
                console.log(`⚡ Skill activado: ${skill.name}`);
                await skill.execute(context);
            }

        }

    }

}