document.addEventListener('contextmenu', function (e) {
    e.preventDefault()
})

const graphControl = document.querySelector('#graph-control')
const renameInput = document.querySelector('#rename-input')
const cancelBtn = document.querySelector('#cancel')
const okBtn = document.querySelector('#ok')
const renameDiv = document.querySelector('#rename')
const removeBtn = document.querySelector('#remove-icon')
const addNodeBtn = document.querySelector('#add-node')
const addEdgeBtn = document.querySelector('#add-edge')
const propertiesAddNewRowBtn = document.querySelector('.add-new-row')
const propertiesOkBtn = document.querySelector('#properties-ok')
const propertiesCancelBtn = document.querySelector('#properties-cancel')
const editPropertiesBtn = document.querySelector('#edit-properties')

editPropertiesBtn.onclick = editProperties
cancelBtn.onclick = cancel
okBtn.onclick = ok
removeBtn.onclick = remove
addNodeBtn.onclick = addNode
addEdgeBtn.onclick = addEdge
propertiesAddNewRowBtn.onclick = addNewRow
propertiesCancelBtn.onclick = propertiesCancel
propertiesOkBtn.onclick = propertiesOk

let drawingNode = false
let drawingEdge = false
let tobeConnectedNodes = {source: undefined, target: undefined}
let uniqueEdgeId, uniqueNodeId

var s = new sigma({
    renderer: {
        container: document.getElementById('graph-container'),
        type: 'canvas'
    },
    settings: {
        autoRescale: false,
        doubleClickEnabled: false,
        doubleClickEnabled: false,
        minEdgeSize: 0.5,
        maxEdgeSize: 4,
        enableEdgeHovering: true,
        edgeHoverColor: 'edge',
        defaultEdgeHoverColor: '#000',
        edgeHoverSizeRatio: 1,
        edgeHoverExtremities: true,
        defaultEdgeLabelColor: '#00008B',
        defaultEdgeLabelSize: 20
    }
});
const camera = s.cameras[0]

fetch('data.json').then(res => res.json()).then((res) => {
    s.graph.read(res);
    console.log(res)
    nodeIds = res.nodes.map(node => node.id.slice(1))
    maxNodeId = Math.max(...nodeIds)
    uniqueNodeId = maxNodeId + 1
    edgeIds = res.edges.map(edge => edge.id.slice(1))
    maxEdgeId = Math.max(...edgeIds)
    uniqueEdgeId = maxEdgeId + 1
    console.log('sigma graph', s.graph)
    camera.goTo({
        x: 350,
        y: 300,
        ratio: 1.4,
        angle: 0
    })
    s.refresh()
})

let activeEdge, activeNode, activeElement

s.bind('clickNode', function (e) {
    if (drawingNode) {
        drawingNode = false
        addNodeBtn.classList.remove('active')
    }
    unselectEverything()
    if (drawingEdge) {
        tobeConnectedNodes.target = e.data.node.id
        activeNode = undefined
        drawingEdge = false
        addEdgeBtn.classList.remove('active')
        const edgeId = `e${uniqueEdgeId}`
        const existingEdges = s.graph.edges().filter(edge => {
            return edge.source === tobeConnectedNodes.source && edge.target === tobeConnectedNodes.target
        })
        tobeAddedEdge = {
            id: edgeId,
            source: tobeConnectedNodes.source,
            target: tobeConnectedNodes.target,
            size: 10,
            type: "curve",
            color: "#ccc",
            hover_color: "#000",
            label: `label ${uniqueEdgeId}`,
            count: existingEdges.length * 10
        }
        s.graph.addEdge(tobeAddedEdge)
        uniqueEdgeId++
    } else {
        activeNode = e.data.node
        console.log(activeNode)
        activeNode.color = '#f00'
        activeNode.size *= 1.3
        graphControl.style.display = 'block'
        addNodeBtn.style.display = 'none'
        addEdgeBtn.style.display = 'inline-block'
    }
    console.log('node clicked active node: ',activeNode)
    s.refresh()
});
s.bind('clickEdge', function (e) {
    if (drawingNode) {
        drawingNode = false
        addNodeBtn.classList.remove('active')
    }
    unselectEverything()
    activeEdge = e.data.edge
    console.log(activeEdge)
    activeEdge.color = '#00f'
    graphControl.style.display = 'block'
    addNodeBtn.style.display = 'none'
    addEdgeBtn.style.display = 'none'
    s.refresh()
});
s.bind('clickStage', function (e) {
    console.log('graph', s.graph)
    const dom = document.querySelector('#graph-container canvas:last-child');
    unselectEverything()
    if (drawingNode) {
        drawingNode = false
        addNodeBtn.classList.remove('active')
        const x = sigma.utils.getX(e.data.captor) - dom.offsetWidth / 2
        const y = sigma.utils.getY(e.data.captor) - dom.offsetHeight / 2
        console.log(x, y, dom.offsetWidth / 2, dom.offsetHeight / 2)
        const point = camera.cameraPosition(x, y);
        console.log('graph Position ', camera.graphPosition(e.data.captor.x, e.data.captor.y))
        console.log(point.x, point.y)
        const nodeId = `n${uniqueNodeId}`
        const nodeLabel = `node No.${uniqueNodeId}`
        const tobeAddedNode = {
            id: nodeId,
            label: nodeLabel,
            x: point.x,
            y: point.y,
            size: 10
        }
        uniqueNodeId++
        s.graph.addNode(tobeAddedNode)
    }
    if (drawingEdge) {
        drawingEdge = false
        addEdgeBtn.classList.remove('active')
    }
    s.refresh()
});
s.bind('rightClickNode rightClickEdge', function (e) {
    unselectEverything()
    if (e.type === 'rightClickNode')
        activeNode = e.data.node
    else if (e.type === 'rightClickEdge')
        activeEdge = e.data.edge
    rename(e)
})


function unselectEverything() {
    if (activeNode) {
        activeNode.color = '#000'
        activeNode.size /= 2
        activeNode = undefined
    }
    if (activeEdge) {
        activeEdge.color = '#ccc'
        activeEdge.size /= 2
        activeEdge = undefined
    }
    graphControl.style.display = 'none'
    addNodeBtn.style.display = 'block'
}

function rename(e) {
    activeElement = activeNode || activeEdge
    renameInput.value = ''
    renameInput.placeholder = activeElement.label
    renameDiv.style.display = 'flex'
    renameInput.focus()
}

function cancel(e) {
    renameDiv.style.display = 'none'
    s.refresh()
}

function ok(e) {
    activeElement = activeNode || activeEdge
    if (activeElement) {
        activeElement.label = renameInput.value
    }
    renameDiv.style.display = 'none'
    s.refresh()
}

function remove(e) {
    if (activeEdge) {
        s.graph.dropEdge(activeEdge.id)
    } else if (activeNode) {
        s.graph.dropNode(activeNode.id)
    }
    s.refresh()
}

function addNode(e) {
    drawingNode = true
    addNodeBtn.classList.add('active')
}

function addEdge(e) {
    drawingEdge = true
    addEdgeBtn.classList.add('active')
    tobeConnectedNodes.source = activeNode.id
}

function addNewRow(e) {
    const newRow = document.createElement('tr')
    newRow.innerHTML = '<td><input type="text"></td>\n' +
        '            <td><input type="text"></td>\n' +
        '            <td>\n' +
        '                <button onclick="deleteRow(this)" class="delete">Delete</button>\n' +
        '            </td>'
    document.querySelector('tbody').appendChild(newRow)
}

function deleteRow(element) {
    element.parentElement.parentElement.remove()
}

function propertiesCancel(e) {
    document.querySelector('#properties').style.display = 'none'
    unselectEverything()
    s.refresh()
}

function propertiesOk(e) {
    const properties = document.querySelectorAll('tbody tr')
    const editedProperties = {}
    for (let property of properties) {
        console.log('property', property)
        const propertyInputs = property.querySelectorAll('input')
        const key = propertyInputs[0].value
        const value = propertyInputs[1].value
        if (key && value)
            editedProperties[key] = value
    }
    console.log(activeEdge, activeNode)
    console.log('editedProperties', editedProperties)
    activeElement = activeEdge || activeNode
    activeElement.properties = editedProperties
    console.log(activeElement, activeNode, activeEdge)
    unselectEverything()
    document.querySelector('#properties').style.display = 'none'
    s.refresh()
}

function editProperties(e) {
    activeElement = activeEdge || activeNode
    document.querySelector('tbody').innerHTML = ''
    if (activeElement.properties) {
        for (let key in activeElement.properties) {
            const row = document.createElement('tr')
            row.innerHTML = '<tr>\n' +
                '            <td><input type="text"></td>\n' +
                '            <td><input type="text"></td>\n' +
                '            <td>\n' +
                '                <button onclick="deleteRow(this)" class="delete">Delete</button>\n' +
                '            </td>\n' +
                '        </tr>'
            const rowInputs = row.querySelectorAll('input')
            rowInputs[0].value = key
            rowInputs[1].value = activeElement.properties[key]
            document.querySelector('tbody').appendChild(row)
        }
    }
    const row = document.createElement('tr')
    row.innerHTML = '<tr>\n' +
        '            <td><input type="text"></td>\n' +
        '            <td><input type="text"></td>\n' +
        '            <td>\n' +
        '                <button onclick="deleteRow(this)" class="delete">Delete</button>\n' +
        '            </td>\n' +
        '        </tr>'
    document.querySelector('tbody').appendChild(row)


    document.querySelector('tbody').appendChild(row)
    document.querySelector('#properties').style.display = 'flex'
}

// document.querySelector('#properties').style.display = 'none'