import { SkillsRegistry } from "../skills-registry";

SkillsRegistry.register({
  name: "auto-email-validation",

  condition: (context) => {
    return context.input && context.input.email;
  },

  execute: async (context) => {

    const email = context.input.email.trim().toLowerCase();

    context.input.email = email;

    console.log("📧 Email normalizado automáticamente");
  }
});