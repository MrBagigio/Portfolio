/**
 * commands/registry.js
 * Registers all available commands in the command registry
 */

import { commandRegistry } from './index.js';

// Navigation commands
import {
    OpenProjectCommand,
    SetCursorCommand,
    NavigateCommand,
    SetThemeCommand,
    SetAccessibilityCommand
} from './navigation.js';

// System commands
import {
    PlaySoundCommand,
    GetWeatherCommand,
    SystemInfoCommand,
    ShowAnalyticsCommand,
    ShowPersonalityCommand
} from './system.js';

// Project commands
import {
    SearchProjectsCommand,
    SuggestActionCommand,
    AnalyzeCodeCommand,
    GitStatusCommand,
    LearnPreferenceCommand,
    CodeSnippetCommand,
    CalculateCommand
} from './projects.js';

// Information commands
import {
    GetGeneralKnowledgeCommand,
    GetNewsHeadlinesCommand,
    PreviewMultimediaCommand,
    ConversationModeCommand,
    GreetingCommand,
    PersonalStatusCommand,
    QuerySkillsCommand,
    QueryToolsCommand,
    QueryContactCommand,
    QueryProjectCountCommand,
    QueryTechnologiesCommand,
    QueryFAQCommand,
    QueryAboutOperatorCommand,
    CompoundCommandCommand,
    WhoAreYouCommand,
    CanDoCommand,
    WhatDoYouDoCommand
} from './information.js';

// Register all commands
commandRegistry.register('openProject', OpenProjectCommand);
commandRegistry.register('setCursor', SetCursorCommand);
commandRegistry.register('navigate', NavigateCommand);
commandRegistry.register('setTheme', SetThemeCommand);
commandRegistry.register('setAccessibility', SetAccessibilityCommand);

commandRegistry.register('playSound', PlaySoundCommand);
commandRegistry.register('getWeather', GetWeatherCommand);
commandRegistry.register('systemInfo', SystemInfoCommand);
commandRegistry.register('showAnalytics', ShowAnalyticsCommand);
commandRegistry.register('showPersonality', ShowPersonalityCommand);

commandRegistry.register('searchProjects', SearchProjectsCommand);
commandRegistry.register('suggestAction', SuggestActionCommand);
commandRegistry.register('analyzeCode', AnalyzeCodeCommand);
commandRegistry.register('gitStatus', GitStatusCommand);
commandRegistry.register('learnPreference', LearnPreferenceCommand);
commandRegistry.register('codeSnippet', CodeSnippetCommand);
commandRegistry.register('calculate', CalculateCommand);

commandRegistry.register('getGeneralKnowledge', GetGeneralKnowledgeCommand);
commandRegistry.register('getNewsHeadlines', GetNewsHeadlinesCommand);
commandRegistry.register('previewMultimedia', PreviewMultimediaCommand);
commandRegistry.register('conversationMode', ConversationModeCommand);
commandRegistry.register('greeting', GreetingCommand);
commandRegistry.register('personal_status', PersonalStatusCommand);
commandRegistry.register('query_skills', QuerySkillsCommand);
commandRegistry.register('query_tools', QueryToolsCommand);
commandRegistry.register('query_contact', QueryContactCommand);
commandRegistry.register('query_project_count', QueryProjectCountCommand);
commandRegistry.register('query_technologies', QueryTechnologiesCommand);
commandRegistry.register('query_faq', QueryFAQCommand);
commandRegistry.register('query_about_operator', QueryAboutOperatorCommand);
commandRegistry.register('compoundCommand', CompoundCommandCommand);
commandRegistry.register('who_are_you', WhoAreYouCommand);
commandRegistry.register('can_do', CanDoCommand);
commandRegistry.register('what_do_you_do', WhatDoYouDoCommand);

console.log(`[CommandRegistry] Registered ${commandRegistry.getAllIntents().length} commands`);