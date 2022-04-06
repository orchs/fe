import React, { useRef, useEffect, useState } from 'react';
import _ from 'lodash';
import { Table, Tooltip } from 'antd';
import { useSize } from 'ahooks';
import TsGraph from '@fc-plot/ts-graph';
import '@fc-plot/ts-graph/dist/index.css';
import { IPanel } from '../../../types';
import { hexPalette } from '../../../config';
import valueFormatter from '../../utils/valueFormatter';
import { getLegendValues } from '../../utils/getCalculatedValuesBySeries';
import './style.less';

interface IProps {
  inDashboard?: boolean;
  chartHeight?: string;
  tableHeight?: string;
  values: IPanel;
  series: any[];
}

export default function index(props: IProps) {
  const { values, series, inDashboard = true, chartHeight = '200px', tableHeight = '200px' } = props;
  const { custom, options = {} } = values;
  const chartEleRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<TsGraph>(null);
  const legendEleRef = useRef<HTMLDivElement>(null);
  const legendEleSize = useSize(legendEleRef);
  const hasLegend = options.legend?.displayMode !== 'hidden';
  const [legendData, setLegendData] = useState([]);
  let _chartHeight = hasLegend ? '70%' : '100%';
  let _tableHeight = hasLegend ? '30%' : '0px';

  if (!inDashboard) {
    _chartHeight = chartHeight;
    _tableHeight = tableHeight;
  }

  useEffect(() => {
    if (chartEleRef.current) {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
      chartRef.current = new TsGraph({
        colors: hexPalette,
        timestamp: 'X',
        xkey: 0,
        ykey: 1,
        ykeyFormatter: (value) => Number(value),
        chart: {
          renderTo: chartEleRef.current,
          height: chartEleRef.current.clientHeight,
        },
        series: [],
        line: {
          width: 1,
        },
      });
    }
    if (hasLegend) {
      setLegendData(
        getLegendValues(series, {
          util: options?.standardOptions?.util,
          decimals: options?.standardOptions?.decimals,
        }),
      );
    } else {
      setLegendData([]);
    }
    return () => {
      if (chartRef.current && typeof chartRef.current.destroy === 'function') {
        chartRef.current.destroy();
      }
    };
  }, [hasLegend]);

  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.update({
        type: custom.drawStyle === 'lines' ? 'line' : 'bar',
        series,
        area: {
          opacity: custom.fillOpacity,
        },
        stack: {
          enabled: custom.stack === 'noraml',
        },
        curve: {
          enabled: true,
          mode: custom.lineInterpolation,
        },
        tooltip: {
          ...chartRef.current.options.tooltip,
          shared: options.tooltip?.mode === 'all',
          sharedSortDirection: options.tooltip?.sort !== 'none' ? options.tooltip?.sort : undefined,
          pointValueformatter: (val) => {
            return valueFormatter(
              {
                util: options?.standardOptions?.util,
                decimals: options?.standardOptions?.decimals,
              },
              val,
            );
          },
        },
        yAxis: {
          ...chartRef.current.options.yAxis,
          min: options?.standardOptions?.min,
          max: options?.standardOptions?.max,
          plotLines: options?.thresholds?.steps,
          tickValueFormatter: (val) => {
            return valueFormatter(
              {
                util: options?.standardOptions?.util,
                decimals: options?.standardOptions?.decimals,
              },
              val,
            );
          },
        },
      });
    }
    if (hasLegend) {
      setLegendData(
        getLegendValues(series, {
          util: options?.standardOptions?.util,
          decimals: options?.standardOptions?.decimals,
        }),
      );
    } else {
      setLegendData([]);
    }
  }, [JSON.stringify(series), JSON.stringify(custom), JSON.stringify(options)]);

  return (
    <div className='renderer-timeseries-container'>
      <div ref={chartEleRef} style={{ height: _chartHeight }} />
      <div className='renderer-timeseries-legend' style={{ [inDashboard ? 'height' : 'maxHeight']: _tableHeight, overflow: 'hidden' }} ref={legendEleRef}>
        <Table
          rowKey='id'
          size='small'
          scroll={{ x: 650, y: legendEleSize.height || 100 - 46 }}
          columns={[
            {
              title: `Series (${series.length})`,
              dataIndex: 'name',
              width: 150,
              ellipsis: {
                showTitle: false,
              },
              render: (text) => (
                <Tooltip placement='topLeft' title={text} getTooltipContainer={() => document.body}>
                  {text}
                </Tooltip>
              ),
            },
            {
              title: 'Max',
              dataIndex: 'max',
            },
            {
              title: 'Min',
              dataIndex: 'min',
            },
            {
              title: 'Avg',
              dataIndex: 'avg',
            },
            {
              title: 'Sum',
              dataIndex: 'sum',
            },
            {
              title: 'Last',
              dataIndex: 'last',
            },
          ]}
          dataSource={legendData}
          locale={{
            emptyText: '暂无数据',
          }}
          pagination={false}
        />
      </div>
    </div>
  );
}
