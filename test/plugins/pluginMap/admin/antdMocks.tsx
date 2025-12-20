import React from 'react';

export const createAntdMocks = (vi: any) => {
  const MockComponent = ({ children, ...props }: any) => (
    <div {...props}> {children} </div>
  );
  const MockTypography = ({ children, ...props }: any) => (
    <div {...props}> {children} </div>
  );
  (MockTypography as any).Title = ({ children, ...props }: any) => (
    <h2 {...props}> {children} </h2>
  );
  (MockTypography as any).Text = ({ children, ...props }: any) => (
    <span {...props}> {children} </span>
  );
  (MockTypography as any).Paragraph = ({ children, ...props }: any) => (
    <p {...props}> {children} </p>
  );

  return {
    Button: ({ children, ...props }: any) => (
      <button {...props}> {children} </button>
    ),
    Table: ({ dataSource, columns, pagination, ...props }: any) => (
      <div {...props}>
        <table>
          <thead>
            <tr>
              {columns?.map((col: any, j: number) => (
                <th key={j}>{col.title}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dataSource?.map((row: any, i: number) => (
              <tr key={i}>
                {columns?.map((col: any, j: number) => (
                  <td key={j}>
                    {col.render
                      ? col.render(row[col.dataIndex], row)
                      : row[col.dataIndex]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {pagination?.showTotal && (
          <div data-testid="pagination-total">
            {pagination.showTotal(dataSource?.length || 0, [
              1,
              dataSource?.length || 0,
            ])}
          </div>
        )}
      </div>
    ),
    Tag: ({ children, ...props }: any) => <span {...props}> {children} </span>,
    Card: ({ title, children, ...props }: any) => (
      <div {...props}>
        {title && <div className="ant-card-head-title">{title}</div>}
        {children}
      </div>
    ),
    Space: MockComponent,
    Row: MockComponent,
    Col: MockComponent,
    Typography: MockTypography,
    Tooltip: ({ children, title }: any) => (
      <div title={title}> {children} </div>
    ),
    Spin: () => <div data-testid="loading-spinner"> Loading...</div>,
    message: {
      success: vi.fn(),
      error: vi.fn(),
    },
  };
};
