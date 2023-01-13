const TelegramBot = require('node-telegram-bot-api');
const _ = require('lodash');
class TelegramService {
    bot;
    username;
    static instance;

    static initialize(token) {
        if(TelegramService.instance) {
            return TelegramService.instance;
        }

        const instance = new TelegramService();
        const bot = new TelegramBot(token, {polling: true});
        bot.on("polling_error", console.log);
        instance.bot = bot;        

        TelegramService.instance = instance;
        return TelegramService.instance;
    }

    setMyCommands = (commands) => {
        this.bot.setMyCommands(commands);
    }

    sendMessage = (chatId, message, opts) => {
        this.bot.sendMessage(chatId, message, {
            parse_mode: 'Markdown',
            disable_web_page_preview: true,
            ...opts
        });
    }

    async asyncSendMessage (chatId, message, opts){
        await this.bot.sendMessage(chatId, message, {
            parse_mode: 'Markdown',
            disable_web_page_preview: true,
            ...opts
        });
    }

    sendPhoto = (chatId, imageURL, opts) => {
        if(imageURL){
            this.bot.sendPhoto(chatId, imageURL, {
                parse_mode: 'Markdown',
                ...opts
            });
        }else{
            sendMessage(chatId, opts.caption, opts);
        }
    }

    async asyncSendPhoto(chatId, imageURL, opts) {
        if(imageURL){
            await this.bot.sendPhoto(chatId, imageURL, {
                parse_mode: 'Markdown',
                ...opts
            });
        }else{
            await asyncSendMessage(chatId, opts.caption, opts);
        }
    }

    sendVideo = (chatId, imageURL, opts) => {
        if(imageURL){
            this.bot.sendVideo(chatId, imageURL, {
                parse_mode: 'Markdown',
                ...opts
            });
        }else{
            sendMessage(chatId, opts.caption, opts);
        }
    }

    async asyncSendVideo(chatId, imageURL, opts) {
        if(imageURL){
            await this.bot.sendVideo(chatId, imageURL, {
                parse_mode: 'Markdown',
                ...opts
            });
        }else{
            await asyncSendMessage(chatId, opts.caption, opts);
        }
    }

    onText = (pattern, onMessage) => {
        this.bot.onText(pattern, onMessage);
    }

    async isAdministrator(memberId, groupId) {
        const members = await this.bot.getChatAdministrators(groupId)
        return _.some(members, i => i && i.user && i.user.id == memberId);
    }

    async memberData(memberId, groupId) {
        return (await this.bot.getChatMember(groupId, memberId));
    }

    async memberUsername(memberId, groupId) {
        const _memberData = await this.memberData(memberId, groupId);
        return { username: `@${_memberData.user.username}`, name: this.memberFullName(_memberData) };
    }

    async getUsername() {
        if(!this.username){
            this.username = (await this.bot.getMe()).username;
        }
        return this.username;
    }

    memberFullName = (_memberData) => {
        return _memberData.user.first_name + _memberData.user.last_name ? ' ' + _memberData.user.last_name : '';
    }

    onCallback = (fn) => {
        this.bot.on("callback_query", fn);
    }

    printBotInfo() {
        return this.bot.getMe().then(console.log).catch(console.log);
    }
}

module.exports = TelegramService;