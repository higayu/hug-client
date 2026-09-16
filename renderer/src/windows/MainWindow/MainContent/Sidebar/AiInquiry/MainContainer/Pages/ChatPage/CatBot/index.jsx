import BotIcon from '@assets/images/cat_bot.png';

export default function CatBot({className=""}){

    return(
        <div>
            <img 
                src={BotIcon}
                alt="bot-icon"
                className={`object-contain ${className}`}
            />
        </div>
    );
}