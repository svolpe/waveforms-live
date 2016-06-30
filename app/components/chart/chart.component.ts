import {Component, Output, Input, EventEmitter, ElementRef} from '@angular/core';
import {CHART_DIRECTIVES} from 'angular2-highcharts';
import {NavController, Modal} from 'ionic-angular';
import {NgClass} from '@angular/common';

//Pages
import {ModalCursorPage} from '../../pages/cursor-modal/cursor-modal';

@Component({
    selector: 'silverNeedleChart',
    directives: [CHART_DIRECTIVES, NgClass],
    templateUrl: 'build/components/chart/chart.html',
})
export class SilverNeedleChart {
    @Output() chartLoad: EventEmitter<any> = new EventEmitter();
    private nav: NavController;
    public chart: Object;
    private options: Object;
    private xPosition: number;
    private xPositionPixels: number;
    private yPosition: number;
    private numXCursors: number;
    private cursorLabel: any[];
    private xCursorDragStartPos: any;
    private oscopeChartInner: ElementRef;
    private activeCursor: number;
    private activeSeries: number;
    private numYCursors: number;
    private cursorType: string;
    private cursor1Chan: string;
    private cursor2Chan: string;
    private cursorsEnabled: boolean;
    private canPan: boolean;

    private timeDivision: number;
    public base: number;

    private voltDivision: number[];
    private voltBase: number[];

    //[x1, series 0 y1, series 1 y1, x2, series 0 y2, series 1 y2]
    private xCursorPositions: number[];
    //[y1, y2]
    private yCursorPositions: number[];

    constructor(_nav: NavController) {
        this.timeDivision = 3;
        this.base = 12;
        this.nav = _nav;
        this.canPan = false;
        this.cursorsEnabled = false;
        this.cursorType = 'disabled';
        this.cursor1Chan = 'O1';
        this.cursor2Chan = 'O1';
        this.xCursorPositions = [0, 0, 0, 0, 0, 0];
        this.yCursorPositions = [0, 0];
        this.activeSeries = 1;
        this.cursorLabel = ['hey','yo','sup','son'];
        this.activeCursor = -1;
        this.xPosition = 0;
        this.yPosition = 0;
        this.numXCursors = 0;
        this.numYCursors = 0;
        this.options = {
            chart: {
                type: 'line',
                zoomType: '',
                title: '',
                animation: false,
                //panning: true,
                //panKey: 'shift'
            },
            tooltip: {
                enabled: true
            },
            series: [{
                data: [29.9, 36, 47, 57, 67, 71.5, 82, 92, 102, 106.4, 110, 120, 129.2],
                allowPointSelect: true
            },
            {
                data: [50, 60, 70, 80],
                allowPointSelect: true,
                yAxis: 1
            }
            ],
            legend: {
                enabled: false
            },
            yAxis: [{
                gridLineWidth: 1,
                offset: 0,
                labels: {
                    format: '{value:.3f}'
                },
                tickPositioner: function () {
                    let numTicks = 11;
                    let ticks = [];
                    let min = this.chart.yAxis[0].min;
                    let max = this.chart.yAxis[0].max;
                    let delta = (max - min) / (numTicks - 1);
                    for (var i = 0; i < numTicks; i++) {
                        ticks[i] = (min + i * delta).toFixed(3);
                    }
                    return ticks;
                },
                title: {
                    text: 'Series 0'
                }
            }, {
                gridLineWidth: 1,
                offset: 0,
                labels: {
                    enabled: false,
                    format: '{value:.3f}'
                },
                tickPositioner: function () {
                    let numTicks = 11;
                    let ticks = [];
                    let min = this.chart.yAxis[1].min;
                    let max = this.chart.yAxis[1].max;
                    let delta = (max - min) / (numTicks - 1);
                    for (var i = 0; i < numTicks; i++) {
                        ticks[i] = (min + i * delta).toFixed(3);
                    }
                    return ticks;
                },
                title: {
                    text: null
                }
            }],
            plotOptions: {
                series: {
                    pointInterval: 2,
                    pointStart: 0,
                    stickyTracking: false
                }
            },
            credits: {
                enabled: false
            },
            xAxis: {
                labels: {
                    events: {
                        click: function() {
                            console.log('hi');
                        }
                    }
                },
                startOnTick: true,
                endOnTick: true,

                gridLineWidth: 1,
                minorGridLineWidth: 0,

                tickPositioner: function () {
                    let numTicks = 11;
                    let ticks = [];
                    let min = this.chart.xAxis[0].min;
                    let max = this.chart.xAxis[0].max;
                    let delta = (max - min) / (numTicks - 1);
                    let mult = 3;
                    if (delta < .001) {
                        let exp = delta.toExponential(3);
                        let real1 = exp.slice(exp.indexOf('e') - exp.length + 1);
                        mult = -1 * Number(real1) + 3;
                        if (mult > 20) {
                            mult = 20;
                        }
                    }
                    for (var i = 0; i < numTicks; i++) {
                        ticks[i] = (min + i * delta).toFixed(mult); 
                    }
                    return ticks;
                },

                minorTickInterval: 'auto',
                minorTickLength: 10,
                minorTickWidth: 1,
                minorTickPosition: 'inside',

            }
        };
    }


    //Called once on component load
    onLoad(chartInstance) {
        //Save a reference to the chart object so we can call methods on it later
        this.chart = chartInstance;
        
        //Redraw chart to scale chart to container size
        this.redrawChart()
        this.chartLoad.emit(this.chart);
    }

    onPointSelect (event) {
        console.log(event);
      this.activeSeries = event.context.series.index + 1;
      console.log('Active Series: ' + this.activeSeries);
      this.updateYAxisLabels();
    }

    updateYAxisLabels() {
        for (let i = 0; i < this.chart.yAxis.length; i++) {
            if (i === this.activeSeries - 1) {
                this.chart.yAxis[this.activeSeries - 1].update({
                        labels: {
                            enabled: true
                        },
                        title: {
                            text: 'Series ' + i
                        }
                    });
            }
            else {
                this.chart.yAxis[i].update({
                    labels: {
                        enabled: false
                    },
                    title: {
                        text: null
                    } 
                });
            }
        }
    }
    
    /*
    ngAfterViewChecked()
    {
        console.log('AfterViewChecked');
        if(this.chart != undefined)
        {
            this.chart.reflow();
            console.log('reflew!');
        }
    }
    */
    
    redrawChart()
    {
      if(this.chart != undefined)
        {
            this.chart.reflow();
            console.log('redrawChart()');
            this.updateCursorLabels();
        }  
    }

    setXView(position, secsPerDiv) {
        position = parseFloat(position);
        secsPerDiv = parseFloat(secsPerDiv);

        let delta = 5 * secsPerDiv;
        let min = position - delta;
        let max = position + delta;

        this.chart.xAxis[0].setExtremes(min, max);
    }

    drawWaveform(seriesNum: number, waveform: any) {
        //console.log(this.chart.series[0].options.pointInterval);
        this.chart.series[seriesNum].setData(waveform.y, true, false, false);
        this.chart.series[seriesNum].update({
            pointStart: waveform.t0,
            pointInterval: waveform.dt
        });
        this.chart.reflow();
        this.updateCursorLabels();
    }

    removeCursors() {
        this.chart.xAxis[0].removePlotLine('cursor0');
        this.chart.xAxis[0].removePlotLine('cursor1');
        this.chart.yAxis[0].removePlotLine('cursor2');
        this.chart.yAxis[0].removePlotLine('cursor3');
        console.log(this.cursorLabel);
        for (let i = 0; i < this.cursorLabel.length; i++) {
            if (typeof(this.cursorLabel[i]) === 'object') {
                this.cursorLabel[i].destroy();
                this.cursorLabel[i] = 'empty';
                console.log('rekt label ' + i);
            }
        }
        this.numXCursors = 0;
        this.numYCursors = 0;
        this.xCursorPositions = [0, 0, 0, 0, 0, 0];
        this.yCursorPositions = [0, 0];
    }

    addXCursor() {
        //TODO DISPLAY CORRECT INITIAL VALUES FROM EXTREMES RETURN
        console.log('adding x cursor');
        let extremes = this.chart.xAxis[0].getExtremes();
        let initialValue: number;
        if (this.numXCursors == 0) {
            initialValue = extremes.min;
            this.xCursorPositions[3 * this.numXCursors] = extremes.min;
            this.xCursorPositions[3 * this.numXCursors + 1] = this.chart.series[0].data[0].y;
            this.xCursorPositions[3 * this.numXCursors + 2] = this.chart.series[1].data[0].y;
        }
        else {
            initialValue = extremes.max;
            this.xCursorPositions[3 * this.numXCursors] = extremes.max;
            this.xCursorPositions[3 * this.numXCursors + 1] = this.chart.series[0].data[this.chart.series[0].data.length - 1].y;
            this.xCursorPositions[3 * this.numXCursors + 2] = this.chart.series[1].data[this.chart.series[1].data.length - 1].y;
        }
        this.chart.xAxis[0].addPlotLine({
            value: initialValue,
            color: 'blue',
            width: 3,
            zIndex: 100 + this.numXCursors,
            id: 'cursor' + this.numXCursors,
        });
        this.cursorLabel[this.numXCursors] = this.chart.renderer.text('Cursor ' + this.numXCursors, 100, 100).add();
        this.chart.xAxis[0].plotLinesAndBands[this.numXCursors].svgElem.element.id = 'cursor' + this.numXCursors;
        //let options = this.chart.options;
        //console.log(options);
        this.chart.options.chart.events.click = function (event) {
            console.log('chart click');
        };
        //this.chart = new Highcharts.Chart(options);
        //Set Mouse To Pointer On Hover Over
        this.chart.xAxis[0].plotLinesAndBands[this.numXCursors].svgElem.css({
            'cursor': 'pointer'
        })

            .on('mousedown', (event) => {
                this.activeCursor = parseInt(event.srcElement.id.slice(-1)) + 1;
                this.xCursorDragStartPos = event.clientX;
                this.xCursorStartDrag(this.numXCursors, event.clientX);
            })
            .on('mouseup', (event) => {
                //console.log('mouse released on cursor');
                //console.log('stop')
                this.activeCursor = -1;
            });

        this.numXCursors++;
    }

    addYCursor() {
        console.log('adding Y cursor number: ' + this.numYCursors);
        let initialValue: number;
        let extremes = this.chart.yAxis[0].getExtremes();
        if (this.numYCursors == 0) {
            initialValue = extremes.min;
        }
        else {
            initialValue = extremes.max;
        }
        this.chart.yAxis[0].addPlotLine({
            value: initialValue,
            color: 'red',
            width: 3,
            zIndex: 102 + this.numYCursors,
            id: 'cursor' + (this.numYCursors + 2)
        });
        this.yCursorPositions[this.numYCursors] = initialValue;
        //console.log((this.chart.yAxis[0].dataMin).toPixels());
        if (this.cursorType !== 'track') {
            this.cursorLabel[this.numYCursors + 2] = this.chart.renderer.text('Cursor ' + (this.numYCursors + 2), 100, 500).add();
        }
        this.chart.yAxis[0].plotLinesAndBands[this.numYCursors].svgElem.element.id = 'cursor' + (this.numYCursors + 2);
        //let options = this.chart.options;
        //console.log(options);
        this.chart.options.chart.events.click = function (event) {
            console.log('chart click');
        };
        //this.chart = new Highcharts.Chart(options);
        //Set Mouse To Pointer On Hover Over
        this.chart.yAxis[0].plotLinesAndBands[this.numYCursors].svgElem.css({
            'cursor': 'pointer'
        })

            .on('mousedown', (event) => {
                if (this.cursorType !== 'track') {
                    this.activeCursor = parseInt(event.srcElement.id.slice(-1)) + 1;
                    //this.xCursorDragStartPos = event.clientX;
                    this.yCursorStartDrag(this.numYCursors + 2, event.clientX);
                }
            })
            .on('mouseup', (event) => {
                //console.log('mouse released on cursor');
                console.log('Ystop')
                this.activeCursor = -1;
            });

        this.numYCursors++;
    }
    

    xCursorStartDrag(cursorId, xStartPos) {
        //console.log('start');
        if (this.cursorType === 'track') {
            this.oscopeChartInner.nativeElement.addEventListener('mousemove', this.trackCursorDragListener);
        }
        else {
            this.oscopeChartInner.nativeElement.addEventListener('mousemove', this.cursorDragListener);
        }
        this.oscopeChartInner.nativeElement.addEventListener('mouseup', this.xCursorStopDrag.bind(this));
    }

    yCursorStartDrag(cursorId, xStartPos) {
        this.oscopeChartInner.nativeElement.addEventListener('mousemove', this.yCursorDragListener);
        this.oscopeChartInner.nativeElement.addEventListener('mouseup', this.yCursorStopDrag.bind(this));
    }

    xCursorStopDrag() {
        if (this.cursorType === 'track') {
            this.oscopeChartInner.nativeElement.removeEventListener('mousemove', this.trackCursorDragListener);
        }
        else {
            this.oscopeChartInner.nativeElement.removeEventListener('mousemove', this.cursorDragListener);
        }

        //console.log('done');
        //console.log(this.chart.xAxis[0].plotLinesAndBands[0].options.value);
    }

    yCursorStopDrag() {
        this.oscopeChartInner.nativeElement.removeEventListener('mousemove', this.yCursorDragListener);
        //console.log('done');
        //console.log(this.chart.xAxis[0].plotLinesAndBands[0].options.value);
    }

    trackCursorDragListener = function (event) {
        let xVal = this.chart.xAxis[0].translate(event.layerX - this.chart.plotLeft, true).toFixed(3); 
        let offset = 110;  
        let yCor = event.layerY;
        if (xVal < this.chart.series[0].data[0].x || event.chartX < this.chart.plotLeft) {
            xVal = this.chart.series[0].data[0].x;
            //event.chartX = this.chart.plotLeft;
        }
        if (xVal > this.chart.series[0].data[this.chart.series[0].data.length -1].x || event.chartX > this.oscopeChartInner.nativeElement.clientWidth - this.chart.plotLeft) {
            xVal = this.chart.series[0].data[this.chart.series[0].data.length -1].x;
            offset = -20;
        }
        if (yCor > this.chart.yAxis[0].toPixels(this.chart.yAxis[0].dataMin)) {
            yCor = this.chart.yAxis[0].toPixels(this.chart.yAxis[0].dataMin);
        }
        if (yCor < this.chart.yAxis[0].toPixels(this.chart.yAxis[0].dataMax)) {
            yCor = this.chart.yAxis[0].toPixels(this.chart.yAxis[0].dataMax);
        }
        
        let pointNum = Math.round((xVal - this.chart.series[0].data[0].x) / this.chart.series[0].pointInterval);
        let pointNum1 = pointNum;
        let pointNum2 = pointNum;
        //Need to add case for series[0] limit to length
        //Ask if all data will have equal num points?
        if (pointNum > this.chart.series[1].data.length - 1) {
            pointNum2 = this.chart.series[1].data.length - 1;
        }
        //console.log(this.chart.series[0].data[pointNum].plotY + 15);
        //this.chart.xAxis[0].plotLinesAndBands[0].svgElem.translate(event.clientX - this.xCursorDragStartPos);
        this.chart.xAxis[0].plotLinesAndBands[this.activeCursor - 1].options.value = this.chart.series[0].data[pointNum1].x;
        this.chart.yAxis[0].plotLinesAndBands[this.activeCursor - 1].options.value = this.chart.series[0].data[pointNum1].y;
        this.xCursorPositions[3 * this.activeCursor - 3] = parseFloat(this.chart.series[0].data[pointNum1].x);
        this.xCursorPositions[3 * this.activeCursor - 2] = this.chart.series[0].data[pointNum1].y;
        this.xCursorPositions[3 * this.activeCursor - 1] = this.chart.series[1].data[pointNum2].y;
        this.chart.xAxis[0].plotLinesAndBands[this.activeCursor - 1].render();
        this.chart.yAxis[0].plotLinesAndBands[this.activeCursor - 1].render();
        this.cursorLabel[this.activeCursor - 1].attr({
            text: 'Series 1: ' + this.chart.series[0].data[pointNum1].y.toFixed(3) + 'V' + 
            '<br>Series 2: ' + this.chart.series[1].data[pointNum2].y.toFixed(3) + 'V', 
            x: this.chart.xAxis[0].translate(this.chart.xAxis[0].plotLinesAndBands[this.activeCursor - 1].options.value, false) + offset,
            y: yCor,
            zIndex: 99 + this.activeCursor
        });
    }.bind(this);

    yCursorDragListener = function (event) {
        //console.log(event);
        //SOME WEIRD Y PIXEL OFFSET SO NEED TO CORRECT BY CALCULATING YDELTA AND ADDING THAT TO YVAL CALCULATION
        let yDelta = event.layerY - (this.chart.yAxis[0].toPixels(parseFloat(this.chart.yAxis[0].toValue(event.chartY - this.chart.plotTop))));
        let yVal = parseFloat(this.chart.yAxis[0].toValue(event.chartY - this.chart.plotTop + yDelta)).toFixed(3);
        let xCor = event.layerX;
        let yCor = event.layerY;
        if (yVal > this.chart.yAxis[0].dataMax) {
            yVal = this.chart.yAxis[0].dataMax;
            yCor = this.chart.yAxis[0].toPixels(yVal);
        }

        if (yVal < this.chart.yAxis[0].dataMin) {
            yVal = this.chart.yAxis[0].dataMin;
            yCor = this.chart.yAxis[0].toPixels(yVal);
        }

        if (xCor > this.chart.xAxis[0].toPixels(this.chart.xAxis[0].dataMax)) {
            xCor = this.chart.xAxis[0].toPixels(this.chart.xAxis[0].dataMax) - 50;
        }

        if (xCor < this.chart.xAxis[0].toPixels(this.chart.xAxis[0].dataMin)) {
            xCor = this.chart.xAxis[0].toPixels(this.chart.xAxis[0].dataMin);
        }
        //console.log('pointNum: ' + pointNum, this.chart.series[0].data[0].y, this.chart.options.plotOptions.series.pointInterval);
        //console.log(this.chart.series[0].data[pointNum].plotY + 15);
        //this.chart.xAxis[0].plotLinesAndBands[0].svgElem.translate(event.clientX - this.xCursorDragStartPos);
        this.chart.yAxis[0].plotLinesAndBands[this.activeCursor - 3].options.value = yVal;
        this.yCursorPositions[this.activeCursor - 3] = parseFloat(yVal);
        this.chart.yAxis[0].plotLinesAndBands[this.activeCursor - 3].render();
        this.cursorLabel[this.activeCursor - 1].attr({
            text: yVal + 'V', 
            x: xCor,
            y: yCor - 10,
            zIndex: 99 + this.activeCursor
        });
    }.bind(this);

    cursorDragListener = function (event) {
        let xVal = this.chart.xAxis[0].translate(event.layerX - this.chart.plotLeft, true).toFixed(1); 
        let offset = 110;  
        let yCor = event.layerY;
        if (xVal < this.chart.series[0].data[0].x || event.chartX < this.chart.plotLeft) {
            xVal = this.chart.series[0].data[0].x;
            //event.chartX = this.chart.plotLeft;
        }
        if (xVal > this.chart.series[0].data[this.chart.series[0].data.length -1].x || event.chartX > this.oscopeChartInner.nativeElement.clientWidth - this.chart.plotLeft) {
            xVal = this.chart.series[0].data[this.chart.series[0].data.length -1].x;
            offset = -20;
        }
        if (yCor > this.chart.yAxis[0].toPixels(this.chart.yAxis[0].dataMin)) {
            yCor = this.chart.yAxis[0].toPixels(this.chart.yAxis[0].dataMin);
        }
        if (yCor < this.chart.yAxis[0].toPixels(this.chart.yAxis[0].dataMax)) {
            yCor = this.chart.yAxis[0].toPixels(this.chart.yAxis[0].dataMax);
        }
        let pointNum = Math.round((xVal - this.chart.series[0].data[0].x) / this.chart.series[0].pointInterval);
        let pointNum1 = pointNum;
        let pointNum2 = pointNum;
        //Need to add case for series[0] limit to length
        //Ask if all data will have equal num points?
        if (pointNum > this.chart.series[1].data.length - 1) {
            pointNum2 = this.chart.series[1].data.length - 1;
        }
        //console.log(this.chart.series[0].data[pointNum].plotY + 15);
        //this.chart.xAxis[0].plotLinesAndBands[0].svgElem.translate(event.clientX - this.xCursorDragStartPos);
        this.chart.xAxis[0].plotLinesAndBands[this.activeCursor - 1].options.value = xVal;
        this.xCursorPositions[3 * this.activeCursor - 3] = parseFloat(xVal);
        this.xCursorPositions[3 * this.activeCursor - 2] = this.chart.series[0].data[pointNum1].y;
        this.xCursorPositions[3 * this.activeCursor - 1] = this.chart.series[1].data[pointNum2].y;
        this.chart.xAxis[0].plotLinesAndBands[this.activeCursor - 1].render();
        this.cursorLabel[this.activeCursor - 1].attr({
            text: 'Series 1: ' + this.chart.series[0].data[pointNum1].y.toFixed(3) + 'V' + 
            '<br>Series 2: ' + this.chart.series[1].data[pointNum2].y.toFixed(3) + 'V', 
            x: this.chart.xAxis[0].translate(this.chart.xAxis[0].plotLinesAndBands[this.activeCursor - 1].options.value, false) + offset,
            y: yCor,
            zIndex: 99 + this.activeCursor
        });
    }.bind(this);

    setHeight() {
        console.log('Height change not implemented');
        //this.chart.
        /*
        console.log(this.chart.container);
        this.chart.container = this.oscopeChartInner;
        this.chart.reflow();
        console.log(this.chart.container);
        */
    }

    setTitle(newTitle: string) {
        this.chart.setTitle({
            text: newTitle
        });
    }

    getNumCursors() {
        return this.numXCursors;
    }

    setElementRef(element) {
        this.oscopeChartInner = element;
        console.log('ElementRef set in chart component :D');
    }

    getCursorDeltas() {
        //[xdeltas, series 0 ydeltas on x cursors, series 1 ydeltas on x cursors, ydeltas on y cursors]
        let xDelta = Math.abs(this.xCursorPositions[3] - this.xCursorPositions[0]);
        let xDeltaSer0Y = Math.abs(this.xCursorPositions[4] - this.xCursorPositions[1]);
        let xDeltaSer1Y = Math.abs(this.xCursorPositions[5] - this.xCursorPositions[2]);
        let yDelta = Math.abs(this.yCursorPositions[1] - this.yCursorPositions[0]);
        return [xDelta, xDeltaSer0Y, xDeltaSer1Y, yDelta];
    }

    exportCsv(fileName: string) {
        fileName = fileName + '.csv';
        let csvContent = 'data:text/csv;charset=utf-8,';
        let series1Points = [];
        let series2Points = [];
        let seriesPointsArray = [series1Points, series2Points];
        let timePoints = [];
        let maxLength = 0;
        for (let i = 0; i < this.chart.series.length; i++) {
            if (this.chart.series[i].data.length > maxLength) {
                for (let j = 0; j < this.chart.series[i].data.length; j++) {
                    (seriesPointsArray[i])[j] = this.chart.series[i].data[j].y;
                    timePoints[j] = j * this.chart.options.plotOptions.series.pointInterval;
                }
            }
            else {
                for (let j = 0; j < this.chart.series[i].data.length; j++) {
                    (seriesPointsArray[i])[j] = this.chart.series[i].data[j].y;
                }
            }
        }
        csvContent = csvContent + (timePoints.join()) + '\n' + (series2Points.join()) + '\n' + (series1Points.join());
        let encodedUri = encodeURI(csvContent);
        let link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", fileName);
        document.body.appendChild(link);
        link.click();
    }

    openCursorModal() {
        let modal = Modal.create(ModalCursorPage, {
            cursorType: this.cursorType,
            cursor1Chan: this.cursor1Chan,
            cursor2Chan: this.cursor2Chan
        });
        modal.onDismiss(data=> {
            if (data.save) {
                console.log('saving data');
                this.cursorType = data.cursorType;
                this.cursor1Chan = data.cursor1Chan;
                this.cursor2Chan = data.cursor2Chan;
                this.handleCursors();
            }
        });
        this.nav.present(modal);
    }

    handleCursors() {
        this.removeCursors();
        if (this.cursorType === 'time') {
            this.addXCursor();
            this.addXCursor();
        }
        else if (this.cursorType === 'disabled') {

        }
        else if (this.cursorType === 'track') {
            this.addXCursor();
            this.addXCursor();
            this.addYCursor();
            this.addYCursor();
        }
        else if (this.cursorType === 'voltage') {
            this.addYCursor();
            this.addYCursor();
        }
        else {
            console.log('error in handle cursors()');
        }
    }

    enableCursors() {
        this.cursorsEnabled = true;
    }

    clearSeries() {
        let numSeries = this.chart.series.length;
        //remove all series except series 0
        for (let i = 0; i < numSeries - 1; i++) {
            this.chart.series[numSeries - i - 1].remove(false);
        }
            //this.chart.series[1].remove(false);
        
    }

    onChartClick(event) {
        if (event.srcElement.localName === 'rect' && this.oscopeChartInner !== undefined) {
            this.canPan = true;
            this.xPositionPixels = event.chartX;
            this.oscopeChartInner.nativeElement.addEventListener('mousemove', this.panListener);
        }
        else {
        }
    }

    clearMouse() {
        this.canPan = false;
        if (this.oscopeChartInner !== undefined) {
            this.oscopeChartInner.nativeElement.removeEventListener('mousemove', this.panListener);
        }
    }

    panListener = function(event) {
        let newVal = this.chart.xAxis[0].toValue(event.chartX);
        let oldValinNewWindow = this.chart.xAxis[0].toValue(this.xPositionPixels);
        let difference = newVal - oldValinNewWindow;
        this.setXExtremes(difference);
        this.xPositionPixels = event.chartX;
    }.bind(this);

    setXExtremes(positionChange: number) {
        let newPos = this.base - positionChange;
        let min = newPos - this.timeDivision * 5;
        let max = newPos + this.timeDivision * 5; 
        this.chart.xAxis[0].setExtremes(min, max, true, false);
        this.base = newPos;
    }

    setYExtremes(seriesSettings: any) {
        let offset = seriesSettings.voltBase;
        let min = offset - (seriesSettings.voltsPerDiv * 5);
        let max = offset + (seriesSettings.voltsPerDiv * 5);
        this.chart.yAxis[seriesSettings.seriesNum].setExtremes(min, max);
    }

    updateCursorLabels() {        
        if (this.cursorType === 'disabled') {
            return;
        }

        else if (this.cursorType === 'time' || this.cursorType === 'track') {
            for (let i = 0; i < 2; i++) {
                //let pointNum = Math.round((this.chart.xAxis[0].plotLinesAndBands[i].options.value - this.chart.xAxis[0].plotLinesAndBands[i].axis.dataMin) / this.chart.series[0].pointInterval);
                if (typeof(this.cursorLabel[i]) === 'object') {
                    this.cursorLabel[i].attr({
                        x: this.chart.xAxis[0].toPixels(this.chart.xAxis[0].plotLinesAndBands[i].options.value),
                    });
                }
            }
        }

        else if (this.cursorType === 'voltage') {
            //labels stay in place but the actual lines don't move. *shrug*
            return;
        }

        else {
            console.log('error updating cursor labels');
        }
        
    }

    setTimeSettings(timeObj: any) {
        this.timeDivision = timeObj.timePerDiv;
        this.base = timeObj.base;
        let min = this.base - (this.timeDivision * 5);
        let max = this.base + (this.timeDivision * 5);
        this.chart.xAxis[0].setExtremes(min, max, true, false);
    }

    setSeriesSettings(seriesSettings: any) {
        this.voltDivision = seriesSettings.voltsPerDiv;
        this.voltBase = seriesSettings.voltBase;
        this.setYExtremes(seriesSettings);
    }

    setActiveSeries(seriesNum: number) {
        this.activeSeries = seriesNum;
        this.updateYAxisLabels();
    }


}
