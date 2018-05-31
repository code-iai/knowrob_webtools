$(showMatrx('../test/log.owl','#myContainer',(d, nodes)=> {
    console.log(d);
    if (!isNaN(d)) {
        console.log(nodes[d].name);
    }
    else{
        console.log(nodes[d[0].x].name);
    }
}));