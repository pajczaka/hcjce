const axios = require('axios');

const CONFIG = {
    COMPONENTS_URL: 'http://herocoders.atlassian.net/rest/api/3/project/SP/components',
    ISSUES_URL: 'https://herocoders.atlassian.net/rest/api/3/search?jql=project%20%3D%20SP%20',
    MAX_RESULT_PER_PAGE: 100
}

const getAllComponentList = async () => {
    try {
        const componentsListResponse = await axios.get(CONFIG.COMPONENTS_URL)
        return componentsListResponse.data
    } catch (e) {
        console.error('ERROR: Unable to collect components list')
        throw new Error('Cannot fetch components list');
    }
}

const getPaginatedIssues = async (startAt = 0, maxResults = CONFIG.MAX_RESULT_PER_PAGE) => {
    try {
        const issuesListResponse = await axios.get(`${CONFIG.ISSUES_URL}&startAt=${startAt}&maxResults=${maxResults}`);
        return issuesListResponse.data;
    } catch (e) {
        console.error('ERROR: Unable to collect issues list')
        throw new Error('Cannot fetch issues list');
    }
}

const getAllIssuesRecurrent = async (startAt = 0, maxResults = CONFIG.MAX_RESULT_PER_PAGE) => {
    const listOfIssues = await getPaginatedIssues(startAt, maxResults);
    if (listOfIssues.total - listOfIssues.maxResults < listOfIssues.startAt) {
        return listOfIssues.issues;
    } else {
        return [...listOfIssues.issues, ...await getAllIssuesRecurrent((startAt + maxResults), listOfIssues.maxResults)];
    }
}

const printResult = (noLeadsComponents, componentsMap) => {

    console.log(new String(`===== List of components without component lead [total: ${noLeadsComponents.length}] =====\n`).toUpperCase());
    noLeadsComponents.forEach(component => {
        console.log(`ID: ${component.id} \nName: ${component.name} \nNumber of issues related: ${componentsMap[component.id].length} \n`)

    })
}

const main = async () => {

    const componentslist = await getAllComponentList()

    const noLeadsComponents = componentslist.filter(item => !item.lead);

    if (!noLeadsComponents.length) {
        console.log('There are no unassigned components')
        return;
    }

    const noLeadsComponentsIds = noLeadsComponents.map(component => component.id)
    const listOfAllIssues = await getAllIssuesRecurrent()


    const componentsMap = {}
    componentslist.forEach(noLeadsComponent => componentsMap[noLeadsComponent.id] = [])

    listOfAllIssues.forEach(issue => {
        issue.fields.components.forEach(component => {
            if (noLeadsComponentsIds.includes(component.id)) {
                componentsMap[component.id].push(issue)
            }
        })
    })

    printResult(noLeadsComponents, componentsMap)


}

main().catch(e => {
        console.error(e)
        process.exit(1)
    }
);

