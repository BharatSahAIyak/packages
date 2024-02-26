export default async function (task: string, config: any, ULCA_USER_ID: string, ULCA_API_KEY: string, ULCA_CONFIG_URL: string) {
  var myHeaders = new Headers();
  myHeaders.append("userID", ULCA_USER_ID);
  myHeaders.append("ulcaApiKey", ULCA_API_KEY);
  myHeaders.append("Content-Type", "application/json");

  var raw = JSON.stringify({
    "pipelineTasks": [
      {
        "taskType": task,
        "config": config
      }
    ],
    "pipelineRequestConfig": {
      "pipelineId": "64392f96daac500b55c543cd"
    }
  });

  var requestOptions: any = {
    method: 'POST',
    headers: myHeaders,
    body: raw,
    redirect: 'follow'
  };
  try {
    console.log(`${new Date()}: Waiting for ${ULCA_CONFIG_URL} (config API) to respond ...`)
    let response = await fetch(ULCA_CONFIG_URL, requestOptions)
    if (response.status != 200) {
      console.log(response)
      throw new Error(`${new Date()}: API call to ${ULCA_CONFIG_URL} with config '${JSON.stringify(raw, null, 3)}' failed with status code ${response.status}`)
    }
    response = await response.json()
    console.log(`${new Date()}: Responded succesfully`)
    return response
  } catch (error) {
    console.log(error);
    return {
      error
    }
  }
}
