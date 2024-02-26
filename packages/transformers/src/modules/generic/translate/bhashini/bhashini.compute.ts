export default async function(authorization: string, task: string, serviceId: string, url: string, config: any, input: any) {
    var myHeaders = new Headers();
    myHeaders.append("Accept", " */*");
    myHeaders.append("Authorization", authorization);
    myHeaders.append("Content-Type", "application/json");
    config['serviceId'] = serviceId
    if (task == 'tts') {
      config['gender'] = 'male'
      config['samplingRate'] = 8000
    }
    var raw = JSON.stringify({
      "pipelineTasks": [
        {
          "taskType": task,
          "config": config
        }
      ],
      "inputData": input
    });

    var requestOptions: any = {
      method: 'POST',
      headers: myHeaders,
      body: raw,
      redirect: 'follow'
    };

    try {
      console.log(`${new Date()}: Waiting for ${url} for task (${task}) to respond ...`)
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