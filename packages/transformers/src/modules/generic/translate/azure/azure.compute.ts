interface azureInput {
    sourceLanguage: string,
    targetLanguage: string,
    text: string,
    orgId: string | undefined,
    botId: string | undefined
}

export default async function(input: azureInput, url: string) {
    var myHeaders = new Headers();
    myHeaders.append("Accept", " /");
    myHeaders.append("Content-Type", "application/json");

    var raw = JSON.stringify({
        "source_language": input.sourceLanguage,
        "target_language": input.targetLanguage,
        "text": input.text,
        "orgId": input.orgId,
        "botId": input.botId
    });

    var requestOptions: any = {
      method: 'POST',
      headers: myHeaders,
      body: raw,
      redirect: 'follow'
    };

    try {
      console.log(`${new Date()}: Waiting for ${url} for task (translation) to respond ...`)
      let response = await fetch(url, requestOptions)
      if (response.status != 200) {
        console.log(response)
        throw new Error(`${new Date()}: API call to '${url}' with config '${JSON.stringify(raw, null, 3)}' failed with status code ${response.status}`)
      }
      response = await response.json()
      console.log(`${new Date()}: Responded succesfully.`)
      return response
    } catch (error) {
      console.log(error);
      return {
        error
      }
    }
  }