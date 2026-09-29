import { SkillsRegistry } from "../skills-registry.js";

type SkillContext = {
  input?: {
    email?: string;
  };
};

SkillsRegistry.register({
  name: "auto-email-validation",

  condition: (context: SkillContext) => {
    return Boolean(context.input?.email);
  },

  execute: async (context: SkillContext) => {
    const email = context.input?.email?.trim().toLowerCase();

    if (context.input && email) {
      context.input.email = email;
    }

    console.log("📧 Email normalizado automáticamente");
  },
});