import {Component} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import 'rxjs/Rx';

//Components
import {InstrumentComponent} from '../instrument.component';
import {OscChannelComponent} from './osc-channel.component';
import {WaveformComponent} from '../../data-types/waveform';

//Services
import {TransportService} from '../../../services/transport/transport.service';

@Component({
})
export class OscInstrumentComponent extends InstrumentComponent {

    public numChans: number;
    public numDataBuffers = 8;
    public chans: OscChannelComponent[] = [];
    public dataBuffer: Array<Array<WaveformComponent>> = [];
    public dataBufferWriteIndex: number = 0;
    public dataBufferFillSize: number = 0;
    public activeBuffer: string = '0';


    constructor(_transport: TransportService, _oscInstrumentDescriptor: any) {
        super(_transport, '/');
        console.log('OSC Instrument Constructor');

        //Populate DC supply parameters
        this.numChans = _oscInstrumentDescriptor.numChans;

        //Initialize Data Buffers
        for (let i = 0; i < this.numDataBuffers; i++) {
            this.dataBuffer.push(Array(this.numChans));
        }

        //Populate channels        
        _oscInstrumentDescriptor.chans.forEach(dcChanDescriptor => {
            this.chans.push(new OscChannelComponent(dcChanDescriptor));
        })
    }

    runSingleBinary(chans: number[], voltageMultipliers: number[]): Observable<Array<WaveformComponent>> {
        if (chans.length == 0) {
            return Observable.create((observer) => {
                observer.complete();
            });
        }

        let command = {
            "osc": {}
        }
        chans.forEach((element, index, array) => {
            command.osc[chans[index]] =
                [
                    {
                        "command": "runSingle"
                    }
                ]
        });

        return Observable.create((observer) => {
            this.transport.writeReadBinary('/binary', JSON.stringify(command)).subscribe(
                (data) => {
                    console.log(data);
                    let megaString = String.fromCharCode.apply(null, new Int8Array(data.slice(0)));
                    let binaryIndexStringLength = megaString.indexOf('\r\n');
                    let binaryIndex = parseFloat(megaString.substring(0, binaryIndexStringLength));
                    let command = JSON.parse(megaString.substring(binaryIndexStringLength + 2, binaryIndex));
                    console.log(megaString.substring(binaryIndexStringLength + 2, binaryIndex));
                    console.log(command);
                    let binaryData = new Int16Array(data.slice(binaryIndex));
                    let testDoot = Array.prototype.slice.call(binaryData);
                    console.log(binaryData, typeof (binaryData), typeof (testDoot), testDoot);

                    let realArray = testDoot.map((voltage) => {
                        return voltage * voltageMultipliers[0];
                    });
                    command.osc[0][0].waveform.y = realArray;
                    this.dataBuffer[this.dataBufferWriteIndex][0] = new WaveformComponent(command.osc[0][0].waveform);

                    observer.next(this.dataBuffer[this.dataBufferWriteIndex]);
                    this.dataBufferWriteIndex = (this.dataBufferWriteIndex + 1) % this.numDataBuffers;
                    //console.log(this.dataBuffer);
                    if (this.dataBufferFillSize < this.numDataBuffers) {
                        this.dataBufferFillSize++;
                        this.activeBuffer = this.dataBufferFillSize.toString();
                    }
                    else {
                        this.activeBuffer = (this.numDataBuffers).toString();
                    }
                    //Handle device errors and warnings
                    observer.complete();
                },
                (err) => {
                    observer.error(err);
                },
                () => {
                    observer.complete();
                }
            )
        });
    }

    runSingle(chans: Array<number>, voltageMultipliers: number[]): Observable<Array<WaveformComponent>> {

        //If no channels are active no need to talk to hardware
        if (chans.length == 0) {
            return Observable.create((observer) => {
                observer.complete();
            });
        }

        let command = {
            "osc": {}
        }
        chans.forEach((element, index, array) => {
            command.osc[chans[index]] =
                [
                    {
                        "command": "runSingle"
                    }
                ]
        });

        return Observable.create((observer) => {
            this.transport.writeRead(this.endpoint, JSON.stringify(command)).subscribe(
                (data) => {
                    //Handle device errors and warnings
                    if (data.statusCode == 0) {
                        //Clear buffer then parse data into empty buffer
                        this.dataBuffer[this.dataBufferWriteIndex] = [];
                        let typedArray = null;
                        for (let channel in data.osc) {
                            typedArray = new Int16Array(data.osc[channel][0].waveform.y);
                            //If .map on typedArray returns 0 cuz type which is cool I suppose
                            let testArray = Array.prototype.slice.call(data.osc[channel][0].waveform.y);
                            let realArray = testArray.map((voltage) => {
                                return voltage * voltageMultipliers[parseInt(channel)];
                            });
                            data.osc[channel][0].waveform.y = realArray;
                            this.dataBuffer[this.dataBufferWriteIndex][parseInt(channel)] = new WaveformComponent(data.osc[channel][0].waveform);
                        }

                        //Return voltages and complete observer
                        observer.next(this.dataBuffer[this.dataBufferWriteIndex]);
                        this.dataBufferWriteIndex = (this.dataBufferWriteIndex + 1) % this.numDataBuffers;
                        //console.log(this.dataBuffer);
                        if (this.dataBufferFillSize < this.numDataBuffers) {
                            this.dataBufferFillSize++;
                            this.activeBuffer = this.dataBufferFillSize.toString();
                        }
                        else {
                            this.activeBuffer = (this.numDataBuffers).toString();
                        }
                        observer.complete();
                    }
                    else {
                        observer.error(data.statusCode);
                    }
                },
                (err) => {
                    observer.error(err);
                },
                () => {
                    observer.complete();
                }
            )
        });
    }



    streamRunSingle(chans: Array<number>, delay = 0): Observable<Array<WaveformComponent>> {
        //If no channels are active no need to talk to hardware
        if (chans.length == 0) {
            return Observable.create((observer) => {
                observer.complete();
            });
        }

        let command = {
            "osc": {}
        }
        chans.forEach((element, index, array) => {
            command.osc[chans[index]] =
                [
                    {
                        "command": "runSingle"
                    }
                ]
        });

        return Observable.create((observer) => {
            this.transport.streamFrom(this.endpoint, JSON.stringify(command), delay).subscribe(
                (data) => {
                    //Handle device errors and warnings
                    if (data.statusCode == 0) {
                        //Clear buffer then parse data into empty buffer
                        this.dataBuffer[this.dataBufferWriteIndex] = [];
                        for (let channel in data.osc) {
                            let scaledPoints = [];
                            data.osc[parseInt(channel)][0].waveform.y.forEach((element, index, array) => {
                                data.osc[parseInt(channel)][0].waveform.y[index] = element / 1000;
                            });
                            this.dataBuffer[this.dataBufferWriteIndex][parseInt(channel)] = new WaveformComponent(data.osc[channel][0].waveform);
                        }
                        //Return voltages and complete observer
                        observer.next(this.dataBuffer[this.dataBufferWriteIndex]);
                        this.dataBufferWriteIndex = (this.dataBufferWriteIndex + 1) % this.numDataBuffers;
                        if (this.dataBufferFillSize < this.numDataBuffers) {
                            this.dataBufferFillSize++;
                            this.activeBuffer = this.dataBufferFillSize.toString();
                        }
                        else {
                            this.activeBuffer = '8';
                        }
                    }
                    else {
                        observer.error(data.statusCode);
                    }
                },
                (err) => {
                    observer.error(err);
                },
                () => {
                    observer.complete();
                }
            )
        });
    }

}