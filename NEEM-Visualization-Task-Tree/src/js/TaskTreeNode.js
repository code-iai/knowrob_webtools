const d3 = window.d3 || require('d3');
const treeContainerHandler = require('./TreeContainerHandler');
const taskTreeConfiguration = require('./Configuration');

const duration = taskTreeConfiguration.duration;

exports.appendNewNode = (source, nodes_svg) => {
    // Enter any new nodes at the parent's previous position.
    let nodeEnter = nodes_svg.enter().append('g')
        .attr('class', 'node')
        .attr('transform', () => {
            return 'translate(' + source.y0 + ',' + source.x0 + ')';
        })
        .on('click', click)
        .on('mouseover', handleMouseover)

    nodeEnter.append('circle')
        .attr('class', 'nodeCircle')
        .attr('r', 4.5)
        .style('fill', (d) => {
            if (d.successful == 'True'){
                if(d._children){
                    return 'SpringGreen';
                }
                return 'green';
            }
            if(d._children){
                return 'Tomato';
            }

            return 'red';
        });

    nodeEnter.append('text')
        .attr('x', function(d) {
            return d.children || d._children ? -10 : 10;
        })
        .attr('dy', '.35em')
        .attr('class', 'nodeText')
        .attr('text-anchor', (d) => {
            return d.children || d._children ? 'end' : 'start';
        })
        .text((d) => {
            return d.name;
        })
        .style('fill-opacity', 0);

    // Transition nodes to their new position.
    let nodeUpdate = nodes_svg.transition()
        .duration(duration)
        .attr('transform', (d) => {
            return 'translate(' + d.y + ',' + d.x  + ')';
        });

    // Fade the text in
    nodeUpdate.select('text')
        .style('fill-opacity', 1);

    // Transition exiting nodes to the parent's new position.
    let nodeExit = nodes_svg.exit().transition()
        .duration(duration)
        .attr('transform', () => {
            return 'translate(' + source.y + ',' + source.x + ')';
        })
        .remove();

    nodeExit.select('circle')
        .attr('r', 0);

    nodeExit.select('text')
        .style('fill-opacity', 0);
};


// Toggle children function
function toggleChildren(d) {
    let temp = d.children;
    d.children = d._children;
    d._children = temp;

    return d;
}

// Toggle children on click.
function click(d) {
    if (d3.event.defaultPrevented) return; // click suppressed
    d = toggleChildren(d);
    treeContainerHandler.update(d);
    //treeContainerHandler.centerNode(d);
}

function handleMouseover(d) {
    let startTime;
    let startTimeStr;
    let endTime;
    let endTimeStr;

    if(d.startTime){
        startTime = d.startTime;
        startTimeStr = convertTimeToStr(d.startTime);
    }

    if(d.endTime){
        endTime = d.endTime;
        endTimeStr = convertTimeToStr(d.endTime);
    }

    if(startTime && endTime){
        console.log('START TIME: ' + startTimeStr);
        console.log('END TIME: ' + endTimeStr);
        console.log(getRunningTime(startTime, endTime));
    }
}

function convertTimeToStr(timestamp){
    let timestampNumber = parseInt(timestamp)/1000;
    let date = new Date(parseInt(timestampNumber));
    let seconds = (date.getSeconds() < 10) ? "0"+date.getSeconds().toString() : date.getSeconds().toString()
    let microseconds = timestampNumber.toString().split('.')[1];
    microseconds = microseconds ? '.'+microseconds : '';

    return date.getDate()
        + '.' + (date.getMonth()+1)
        + '.' + date.getFullYear()
        + ' ' + date.getHours()
        + ':' + date.getMinutes()
        + ':' + seconds
        + microseconds;
}

function getRunningTime(startTime, endTime){
    const microSecondsInOneHour = 3600000000;
    const microSecondsInOneMinute = 60000000;
    const microSecondsInOneSecond = 1000000;
    const microSecondsInOnemillisecond = 1000;

    let totalTime = (endTime - startTime);
    let totalTimeStr = '';
    let temp = totalTime/microSecondsInOneHour;

    if (temp >= 1.){
        let hours = parseInt(temp);
        totalTime -= hours * microSecondsInOneHour;
        totalTimeStr += hours+':';
    }
    else{
        totalTimeStr += '00:';
    }

    temp = totalTime/microSecondsInOneMinute;

    if (temp >= 1.){
        let minutes = parseInt(temp);
        totalTime -= minutes * microSecondsInOneMinute;
        totalTimeStr += minutes+':';
    }
    else{
        totalTimeStr += '00:';
    }

    temp = totalTime/microSecondsInOneSecond;

    if (temp >= 1.){
        let minutes = parseInt(temp);
        totalTime -= minutes * microSecondsInOneSecond;
        totalTimeStr += minutes+':';
    }
    else{
        totalTimeStr += '00:';
    }

    temp = totalTime/microSecondsInOnemillisecond;

    if (temp >= 1.){
        let minutes = parseInt(temp);
        totalTime -= minutes * microSecondsInOnemillisecond;
        totalTimeStr += minutes+':';
    }
    else{
        totalTimeStr += '00:';
    }

    return totalTimeStr+totalTime;
}