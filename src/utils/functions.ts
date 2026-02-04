export const getDomainName = (urlString: string) => {
    try {
        const url = new URL(urlString);
        let hostname =  url.hostname;
        if (hostname.startsWith('www.')) {
            hostname = hostname.replace('www.', '');
        }
        let domain = hostname.replace(/\.[^.]+$/, '');
        return domain.charAt(0).toUpperCase() + domain.slice(1);

    }
    catch (err) {
        console.log('problem parsing url: ', err);
        return urlString;
    }
}
export const shortenStringWithDots = (sentence: string, lengthDesired: number) => {
    let newSentence = '';
    if (sentence.length > lengthDesired) {
        newSentence = sentence.substring(0, lengthDesired) + '...';
        return newSentence;
    }
    else {
        return sentence;
    }
}
