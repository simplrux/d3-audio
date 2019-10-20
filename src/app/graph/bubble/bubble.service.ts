import { Graph } from '../graph-type.enum';
import * as d3 from 'd3';
import { ColorService } from '../color.service';

export class BubbleService implements Graph {
  graphElement;
  previousData: number[];
  myXConvertor;
  zConvertor;
  public static scaleIndex = 1;

  constructor(
    private hostSvgElement: any,
    private xConvertor: any,
    private yConvertor: any,
    private transitionTime: number,
    private colorService: ColorService
  ) {
    this.zConvertor = d3.scaleLinear()
      .domain(yConvertor.domain())
      .range([0, 40]);
    this.myXConvertor = d3.scaleLinear()
      .domain(xConvertor.domain())
      .range([10, 190]);

  }

  create(data: Uint8Array): void {
    this.previousData = new Array(data.length).fill(0);
    this.update(data);
  }

  update(data: Uint8Array): void {
    const t0 = d3.transition().duration(this.transitionTime).ease(d3.easeLinear);

    // const hullData = [...data];
    // hullData.unshift(0);
    // const hull = this.convexHull(hullData);


    const peaks = [];
    data.forEach((datum, k) => {
      if (k % 3 === 0) {
      if (this.previousData[k] > 0 && datum > this.previousData[k] * 1.5) {
        peaks.push({
          index: k,
          value: datum,
          delta: datum - this.previousData[k]
        });
      }
    }
    });

    const nw = Date.now();
    this.hostSvgElement
      .selectAll('dot' + nw)
      .data(peaks, (datum, index) => index)
      .enter()
      .append('circle')
      .style('fill', (datum: any) => this.colorService.getColorInScale(datum.index, BubbleService.scaleIndex))
      .style('stroke', 'gold')
      .style('stroke-width', '0.2')
      .attr('r', (d: any) => this.zConvertor(0))
      .attr('cx', (d: any) => this.myXConvertor(d.index))
      .attr('cy', (d: any) => this.yConvertor(d.value))
      .attr('opacity', 0.0)
      .transition(t0)
      .attr('opacity', 1)
      .on('start', (d, i, n) => {
        d3.active(n[i])
          .transition()
          .duration(5000)
          .ease(d3.easeExpOut)
          .attr('r', (d: any) => this.zConvertor(d.delta))
          .attr('opacity', 0)
          .remove();
      });
    this.previousData = [...data];


  }
  fade(): void {
  }

  private slope(data, first, second) {

    const u = (first < second) ? first : second;
    const v = (first < second) ? second : first;

    return (data[v] - data[u]) / (v - u); 
  }

  private convexHull(data) {

    const peaks = [];
    const hull = [];
    if(data.length == 0) {
      return peaks;
    } 
    
    if(data.length == 1) {
      return [ {
        index: 0,
        value: data[0],
        delta: data[0] - this.previousData[0]
      }];
    }

    hull.push(0);
    hull.push(1);

    for (let k = 2; k < data.length; k++) {
      let indexOfLastVisiblePoint = hull.length-1;
      let indexOfPointBefore = hull.length - 2;
        while(indexOfPointBefore >= 0) {
          let lastVisiblePoint = hull[indexOfLastVisiblePoint];
          let slopeOfLastVisiblePoint = this.slope(data, lastVisiblePoint, k);
          const pointBefore = hull[indexOfPointBefore];
          let slopeOfLastButOne = this.slope(data, pointBefore, k);
          if(slopeOfLastButOne < slopeOfLastVisiblePoint) {
            while(hull.length-1 > indexOfPointBefore) {
              hull.pop();  
            }
            indexOfLastVisiblePoint = indexOfPointBefore;
          } else {
            indexOfPointBefore = indexOfPointBefore - 1;
          }
        }
        hull.push(k);
    }

    return hull;
  }

}